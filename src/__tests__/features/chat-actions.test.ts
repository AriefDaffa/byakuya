import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fsMocks = vi.hoisted(() => ({
  mkdir: vi.fn(),
  readFile: vi.fn(),
  unlink: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('@/lib/db/pool', () => ({
  query: vi.fn(),
  withTransaction: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/realtime/bus', () => ({
  publishRealtimeEvent: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  ...fsMocks,
  default: fsMocks,
}));

import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { getCurrentUser } from '@/lib/auth/session';
import { query } from '@/lib/db/pool';
import { publishRealtimeEvent } from '@/lib/realtime/bus';
import {
  deleteMessage,
  editMessage,
  getChatList,
  getMessages,
  getOrCreateConversation,
  markAsRead,
  searchMessages,
  searchUsers,
  sendAttachment,
  sendMessage,
} from '@/features/chat/actions';
import {
  createAttachmentStoragePath,
  deleteLocalAttachment,
  getFileExtension,
  getUploadDir,
  readLocalAttachment,
  resolveLocalAttachmentPath,
} from '@/features/chat/attachments';
import {
  MAX_ATTACHMENT_BYTES,
  attachmentFileSchema,
  messageContentSchema,
  paginationSchema,
  searchKeywordSchema,
} from '@/features/chat/schemas';
import type { MessageWithSender } from '@/types/chat';
import type { Attachment, Message, Profile } from '@/types/database';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';
const CONV_ID = '33333333-3333-4333-8333-333333333333';
const MESSAGE_ID = '44444444-4444-4444-8444-444444444444';
const ATTACHMENT_ID = '66666666-6666-4666-8666-666666666666';
const RANDOM_UUID = '55555555-5555-4555-8555-555555555555';
const CREATED_AT = '2026-01-01T00:00:00.000Z';

/**
 * jsdom's File lacks `arrayBuffer()`. The server action relies on it, so tests
 * use a File subclass that supplies the bytes it was constructed with.
 */
class TestFile extends File {
  private readonly contents: Uint8Array;

  constructor(text: string, name: string, options: FilePropertyBag) {
    super([text], name, options);
    this.contents = new TextEncoder().encode(text);
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(this.contents.slice().buffer);
  }
}

interface SqlCall {
  text: string;
  params: unknown[];
}

type Failure =
  | 'membership'
  | 'message-insert'
  | 'attachment-insert'
  | 'chat-list'
  | 'user-search'
  | 'message-search'
  | 'rpc';

interface DbOptions {
  isMember?: boolean;
  ownedMessage?: { id: string; conversation_id: string; sender_id: string } | null;
  insertedMessage?: MessageWithSender;
  updatedMessage?: MessageWithSender | null;
  page?: MessageWithSender[];
  totalMessages?: number;
  chatList?: Array<Record<string, unknown>>;
  conversationId?: string;
  participantIds?: string[];
  users?: Profile[];
  searchResults?: MessageWithSender[];
  attachment?: Attachment;
  fail?: Failure[];
}

function installDb(options: DbOptions = {}) {
  const calls: SqlCall[] = [];
  const failures = new Set(options.fail ?? []);

  const implementation = (sql: string, params: unknown[] = []) => {
    const text = sql.replace(/\s+/g, ' ').trim();
    calls.push({ text, params });
    const includes = (fragment: string) => text.includes(fragment);

    if (includes('SELECT EXISTS (')) {
      if (failures.has('membership')) throw new Error('membership lookup failed');
      return { rows: [{ is_member: options.isMember ?? true }] };
    }

    if (includes('get_or_create_private_conversation')) {
      if (failures.has('rpc')) throw new Error('rpc failed');
      return { rows: [{ conversation_id: options.conversationId ?? CONV_ID }] };
    }

    if (includes('WITH my_memberships AS (')) {
      if (failures.has('chat-list')) throw new Error('chat list failed');
      return { rows: options.chatList ?? [] };
    }

    if (includes('INSERT INTO public.messages')) {
      if (failures.has('message-insert')) throw new Error('message insert failed');
      return { rows: options.insertedMessage ? [options.insertedMessage] : [] };
    }

    if (includes('is_edited = TRUE')) {
      return { rows: options.updatedMessage ? [options.updatedMessage] : [] };
    }

    if (includes('SET is_deleted = TRUE, content = NULL')) {
      return { rows: [] };
    }

    if (includes('DELETE FROM public.messages')) {
      return { rows: [] };
    }

    if (includes('INSERT INTO public.attachments')) {
      if (failures.has('attachment-insert')) throw new Error('attachment insert failed');
      return { rows: options.attachment ? [options.attachment] : [] };
    }

    if (includes('SELECT id, conversation_id, sender_id FROM public.messages')) {
      return { rows: options.ownedMessage ? [options.ownedMessage] : [] };
    }

    if (includes('COUNT(*)::int AS count')) {
      return { rows: [{ count: options.totalMessages ?? 0 }] };
    }

    if (includes('LIMIT $2 OFFSET $3')) {
      return { rows: options.page ?? [] };
    }

    if (includes('m.content ILIKE $2')) {
      if (failures.has('message-search')) throw new Error('message search failed');
      return { rows: options.searchResults ?? [] };
    }

    if (includes('ORDER BY joined_at, id')) {
      return { rows: (options.participantIds ?? []).map((user_id) => ({ user_id })) };
    }

    if (includes('UPDATE public.conversation_members')) {
      return { rows: [] };
    }

    if (includes('FROM public.users u')) {
      if (failures.has('user-search')) throw new Error('user search failed');
      return { rows: options.users ?? [] };
    }

    throw new Error(`Unexpected query: ${text}`);
  };

  vi.mocked(query).mockImplementation(implementation as never);

  return {
    calls,
    find(fragment: string) {
      return calls.find((call) => call.text.includes(fragment));
    },
  };
}

const randomUUIDMock = vi.fn();

function makeProfile(id: string, name: string, email: string): Profile {
  return {
    id,
    name,
    email,
    avatar_url: null,
    status: 'online',
    last_seen: CREATED_AT,
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
  };
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: MESSAGE_ID,
    conversation_id: CONV_ID,
    sender_id: USER_ID,
    content: 'hello',
    type: 'text',
    is_edited: false,
    is_deleted: false,
    reply_to_id: null,
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
    ...overrides,
  };
}

function makeMessageWithSender(
  overrides: Partial<MessageWithSender> = {},
): MessageWithSender {
  return {
    ...makeMessage(overrides),
    sender: makeProfile(USER_ID, 'Arief', 'arief@example.com'),
    attachments: [],
    ...overrides,
  };
}

function makeAttachment(overrides: Partial<Attachment> = {}): Attachment {
  return {
    id: ATTACHMENT_ID,
    message_id: MESSAGE_ID,
    file_name: 'note.txt',
    file_type: 'text/plain',
    file_size: 5,
    file_url: `/api/attachments/${ATTACHMENT_ID}`,
    storage_path: `${CONV_ID}/stored.txt`,
    created_at: CREATED_AT,
    ...overrides,
  };
}

function makeChatRow(overrides: Record<string, unknown> = {}) {
  return {
    id: CONV_ID,
    type: 'private',
    name: null,
    avatar_url: null,
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
    other_user: makeProfile(OTHER_ID, 'Saitama', 'saitama@example.com'),
    last_message: makeMessage({ sender_id: OTHER_ID, content: 'newest' }),
    unread_count: 2,
    ...overrides,
  };
}

beforeEach(() => {
  randomUUIDMock.mockReset().mockReturnValue(RANDOM_UUID);
  vi.stubGlobal('crypto', { randomUUID: randomUUIDMock });

  vi.mocked(getCurrentUser).mockResolvedValue(
    makeProfile(USER_ID, 'Arief', 'arief@example.com'),
  );
  vi.mocked(publishRealtimeEvent).mockResolvedValue(undefined as never);
  vi.mocked(mkdir).mockResolvedValue(undefined as never);
  vi.mocked(writeFile).mockResolvedValue(undefined as never);
  vi.mocked(unlink).mockResolvedValue(undefined as never);
  vi.mocked(readFile).mockResolvedValue(Buffer.from('hello') as never);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('chat schemas', () => {
  it('trims and bounds message content', () => {
    expect(messageContentSchema.parse('  hello  ')).toBe('hello');
    expect(messageContentSchema.safeParse('   ').success).toBe(false);
    expect(messageContentSchema.safeParse('a'.repeat(4001)).success).toBe(false);
  });

  it('coerces pagination values', () => {
    expect(paginationSchema.parse({ limit: '10', offset: '20' })).toEqual({
      limit: 10,
      offset: 20,
    });
  });

  it('validates search keywords', () => {
    expect(searchKeywordSchema.parse('  hi  ')).toBe('hi');
    expect(searchKeywordSchema.safeParse('a').success).toBe(false);
  });

  it('validates attachment files server-side', () => {
    const textFile = new File(['hello'], 'note.txt', { type: 'text/plain' });
    expect(attachmentFileSchema.safeParse(textFile).success).toBe(true);

    const oversized = new File([new Uint8Array(MAX_ATTACHMENT_BYTES + 1)], 'large.png', {
      type: 'image/png',
    });
    expect(attachmentFileSchema.safeParse(oversized).success).toBe(false);

    const executable = new File(['x'], 'run.exe', {
      type: 'application/x-msdownload',
    });
    expect(attachmentFileSchema.safeParse(executable).success).toBe(false);

    expect(attachmentFileSchema.safeParse('not-a-file').success).toBe(false);
  });
});

describe('local attachment helpers', () => {
  it('derives safe extensions and uuid-based storage paths', () => {
    expect(getFileExtension('report.TXT', 'application/octet-stream')).toBe('txt');
    expect(getFileExtension('archive.verylongext', 'text/plain')).toBe('txt');
    expect(getFileExtension('no-extension', 'image/png')).toBe('png');
    expect(getFileExtension('no-extension', 'application/x-unknown')).toBe('bin');

    expect(createAttachmentStoragePath(CONV_ID, 'report.txt', 'text/plain')).toBe(
      `${CONV_ID}/${RANDOM_UUID}.txt`,
    );
  });

  it('rejects paths that escape the upload directory', () => {
    expect(resolveLocalAttachmentPath('')).toBeNull();
    expect(resolveLocalAttachmentPath('../secret.txt')).toBeNull();
    expect(resolveLocalAttachmentPath(`${CONV_ID}/../../secret.txt`)).toBeNull();
    expect(resolveLocalAttachmentPath(`${CONV_ID}/file.txt`)).toBe(
      path.resolve(getUploadDir(), CONV_ID, 'file.txt'),
    );
  });

  it('never reads a traversing storage path', async () => {
    await expect(readLocalAttachment('../secret.txt')).rejects.toThrow(
      'Invalid attachment path',
    );
    expect(readFile).not.toHaveBeenCalled();
  });

  it('ignores missing files when rolling back', async () => {
    const missing = Object.assign(new Error('missing'), { code: 'ENOENT' });
    vi.mocked(unlink).mockRejectedValueOnce(missing as never);

    await expect(deleteLocalAttachment(`${CONV_ID}/gone.txt`)).resolves.toBeUndefined();
  });

  it('propagates real rollback failures', async () => {
    vi.mocked(unlink).mockRejectedValue(new Error('permission denied') as never);

    await expect(deleteLocalAttachment(`${CONV_ID}/locked.txt`)).rejects.toThrow(
      'permission denied',
    );
  });
});

describe('sendMessage', () => {
  it('rejects unauthenticated users', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const db = installDb();

    await expect(sendMessage(CONV_ID, 'hello')).resolves.toEqual({
      error: 'Not authenticated',
    });
    expect(db.calls).toHaveLength(0);
  });

  it('rejects invalid conversation ids before querying', async () => {
    const db = installDb();

    await expect(sendMessage('not-a-uuid', 'hello')).resolves.toEqual({
      error: 'Invalid identifier',
    });
    expect(db.calls).toHaveLength(0);
  });

  it('rejects empty content before querying', async () => {
    const db = installDb();

    await expect(sendMessage(CONV_ID, '   ')).resolves.toEqual({
      error: 'Message cannot be empty',
    });
    expect(db.calls).toHaveLength(0);
  });

  it('rejects non-members without inserting', async () => {
    const db = installDb({ isMember: false });

    await expect(sendMessage(CONV_ID, 'hello')).resolves.toEqual({
      error: 'You are not a member of this conversation',
    });
    expect(db.find('INSERT INTO public.messages')).toBeUndefined();
  });

  it('checks membership, inserts a parameterized message and publishes it', async () => {
    const message = makeMessageWithSender({ content: 'hello' });
    const db = installDb({ insertedMessage: message });

    const result = await sendMessage(CONV_ID, '  hello  ');

    expect(result).toEqual({ data: message });

    const membershipCall = db.find('SELECT EXISTS (');
    expect(membershipCall?.params).toEqual([CONV_ID, USER_ID]);

    const insertCall = db.find('INSERT INTO public.messages');
    expect(insertCall?.params).toEqual([CONV_ID, USER_ID, 'hello', 'text']);
    expect(insertCall?.text).not.toContain('hello');
    expect(insertCall?.text).toContain('$1');

    expect(publishRealtimeEvent).toHaveBeenCalledWith({
      type: 'message:insert',
      conversationId: CONV_ID,
      message,
    });
  });

  it('returns database errors without leaking SQL', async () => {
    installDb({ fail: ['message-insert'] });

    await expect(sendMessage(CONV_ID, 'hello')).resolves.toEqual({
      error: 'message insert failed',
    });
  });
});

describe('sendAttachment', () => {
  it('rejects files over 2MB before writing to disk', async () => {
    installDb();

    const formData = new FormData();
    formData.append(
      'file',
      new File([new Uint8Array(MAX_ATTACHMENT_BYTES + 1)], 'large.png', {
        type: 'image/png',
      }),
    );

    await expect(sendAttachment(CONV_ID, formData)).resolves.toEqual({
      error: 'File must be 2MB or smaller',
    });
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('rejects non-members before writing to disk', async () => {
    installDb({ isMember: false });

    const formData = new FormData();
    formData.append('file', new TestFile('hello', 'note.txt', { type: 'text/plain' }));

    await expect(sendAttachment(CONV_ID, formData)).resolves.toEqual({
      error: 'You are not a member of this conversation',
    });
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('stores the file locally and returns the attachment with a route URL', async () => {
    const file = new TestFile('hello', 'note.txt', { type: 'text/plain' });
    const message = makeMessageWithSender({ content: 'A caption', type: 'file' });
    const attachment = makeAttachment();
    randomUUIDMock.mockReturnValueOnce(RANDOM_UUID).mockReturnValueOnce(ATTACHMENT_ID);

    const db = installDb({ insertedMessage: message, attachment });

    const formData = new FormData();
    formData.append('file', file);

    const result = await sendAttachment(CONV_ID, formData, 'A caption');

    if (!('data' in result) || !result.data) {
      throw new Error('Expected attachment data');
    }

    const storagePath = `${CONV_ID}/${RANDOM_UUID}.txt`;
    const absolutePath = path.resolve(getUploadDir(), storagePath);

    expect(mkdir).toHaveBeenCalledWith(path.dirname(absolutePath), {
      recursive: true,
    });
    const writeCall = vi.mocked(writeFile).mock.calls[0];
    expect(writeCall?.[0]).toBe(absolutePath);
    expect(Buffer.isBuffer(writeCall?.[1])).toBe(true);
    expect(String(writeCall?.[1])).toBe('hello');

    const insertCall = db.find('INSERT INTO public.messages');
    expect(insertCall?.params).toEqual([CONV_ID, USER_ID, 'A caption', 'file']);

    const attachmentCall = db.find('INSERT INTO public.attachments');
    expect(attachmentCall?.params).toEqual([
      ATTACHMENT_ID,
      MESSAGE_ID,
      'note.txt',
      'text/plain',
      file.size,
      `/api/attachments/${ATTACHMENT_ID}`,
      storagePath,
    ]);

    expect(attachmentCall?.text).not.toContain('note.txt');
    expect(result.data.attachments).toEqual([attachment]);
    expect(publishRealtimeEvent).toHaveBeenCalledWith({
      type: 'message:insert',
      conversationId: CONV_ID,
      message: { ...message, attachments: [attachment] },
    });
  });

  it('rolls back the file and message when the attachment row fails', async () => {
    const file = new TestFile('hello', 'note.txt', { type: 'text/plain' });
    const message = makeMessageWithSender({ content: 'note.txt' });
    randomUUIDMock.mockReturnValueOnce(RANDOM_UUID).mockReturnValueOnce(ATTACHMENT_ID);

    const db = installDb({
      insertedMessage: message,
      fail: ['attachment-insert'],
    });

    const formData = new FormData();
    formData.append('file', file);

    await expect(sendAttachment(CONV_ID, formData)).resolves.toEqual({
      error: 'attachment insert failed',
    });

    const storagePath = `${CONV_ID}/${RANDOM_UUID}.txt`;
    const absolutePath = path.resolve(getUploadDir(), storagePath);

    expect(unlink).toHaveBeenCalledWith(absolutePath);
    expect(db.find('DELETE FROM public.messages')?.params).toEqual([MESSAGE_ID]);
    expect(publishRealtimeEvent).not.toHaveBeenCalled();
  });

  it('removes the written file when the message insert fails', async () => {
    const file = new TestFile('hello', 'note.txt', { type: 'text/plain' });
    randomUUIDMock.mockReturnValueOnce(RANDOM_UUID);

    const db = installDb({ fail: ['message-insert'] });

    const formData = new FormData();
    formData.append('file', file);

    await expect(sendAttachment(CONV_ID, formData)).resolves.toEqual({
      error: 'message insert failed',
    });

    const storagePath = `${CONV_ID}/${RANDOM_UUID}.txt`;
    const absolutePath = path.resolve(getUploadDir(), storagePath);

    expect(unlink).toHaveBeenCalledWith(absolutePath);
    expect(db.find('INSERT INTO public.attachments')).toBeUndefined();
  });
});

describe('getMessages', () => {
  it('requires authentication', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const db = installDb();

    const result = await getMessages(CONV_ID, 1);
    expect(result.error).toBe('Not authenticated');
    expect(db.calls).toHaveLength(0);
  });

  it('rejects invalid conversation ids', async () => {
    const db = installDb();

    const result = await getMessages('nope', 1);
    expect(result.error).toBe('Invalid identifier');
    expect(db.calls).toHaveLength(0);
  });

  it('rejects non-members', async () => {
    installDb({ isMember: false });

    const result = await getMessages(CONV_ID, 1);
    expect(result.error).toBe('You are not a member of this conversation');
    expect(result.data).toEqual([]);
  });

  it('returns a page of messages oldest first with totals', async () => {
    const newest = makeMessageWithSender({
      id: '77777777-7777-4777-8777-777777777777',
      content: 'newest',
      created_at: '2026-01-01T00:10:00.000Z',
    });
    const oldest = makeMessageWithSender({ content: 'oldest' });
    const db = installDb({ page: [newest, oldest], totalMessages: 2 });

    const result = await getMessages(CONV_ID, 1);

    expect(result.error).toBeUndefined();
    expect(result.totalPages).toBe(1);
    expect(result.totalMessages).toBe(2);
    expect(result.data.map((message) => message.content)).toEqual(['oldest', 'newest']);

    expect(db.find('LIMIT $2 OFFSET $3')?.params).toEqual([CONV_ID, 30, 0]);
  });

  it('uses the page offset for later pages', async () => {
    const db = installDb({ page: [], totalMessages: 65 });

    const result = await getMessages(CONV_ID, 2);

    expect(result.totalPages).toBe(3);
    expect(db.find('LIMIT $2 OFFSET $3')?.params).toEqual([CONV_ID, 30, 30]);
  });
});

describe('editMessage', () => {
  it('updates only an owned message and publishes the update', async () => {
    const updated = makeMessageWithSender({ content: 'updated', is_edited: true });
    const db = installDb({
      ownedMessage: {
        id: MESSAGE_ID,
        conversation_id: CONV_ID,
        sender_id: USER_ID,
      },
      updatedMessage: updated,
    });

    const result = await editMessage(MESSAGE_ID, '  updated  ');

    expect(result).toEqual({ data: updated });

    const updateCall = db.find('is_edited = TRUE');
    expect(updateCall?.params).toEqual([MESSAGE_ID, USER_ID, 'updated']);

    expect(publishRealtimeEvent).toHaveBeenCalledWith({
      type: 'message:update',
      conversationId: CONV_ID,
      message: updated,
    });
  });

  it('rejects messages owned by someone else', async () => {
    const db = installDb({
      ownedMessage: {
        id: MESSAGE_ID,
        conversation_id: CONV_ID,
        sender_id: OTHER_ID,
      },
    });

    await expect(editMessage(MESSAGE_ID, 'nope')).resolves.toEqual({
      error: 'You can only modify your own messages',
    });
    expect(db.find('is_edited = TRUE')).toBeUndefined();
    expect(publishRealtimeEvent).not.toHaveBeenCalled();
  });

  it('returns not found for missing messages', async () => {
    installDb({ ownedMessage: null });

    await expect(editMessage(MESSAGE_ID, 'nope')).resolves.toEqual({
      error: 'Message not found',
    });
  });
});

describe('deleteMessage', () => {
  it('soft-deletes an owned message and publishes the deletion', async () => {
    const db = installDb({
      ownedMessage: {
        id: MESSAGE_ID,
        conversation_id: CONV_ID,
        sender_id: USER_ID,
      },
    });

    await expect(deleteMessage(MESSAGE_ID)).resolves.toEqual({ success: true });

    expect(db.find('SET is_deleted = TRUE, content = NULL')?.params).toEqual([
      MESSAGE_ID,
      USER_ID,
    ]);
    expect(publishRealtimeEvent).toHaveBeenCalledWith({
      type: 'message:delete',
      conversationId: CONV_ID,
      messageId: MESSAGE_ID,
    });
  });

  it('rejects messages owned by someone else', async () => {
    installDb({
      ownedMessage: {
        id: MESSAGE_ID,
        conversation_id: CONV_ID,
        sender_id: OTHER_ID,
      },
    });

    await expect(deleteMessage(MESSAGE_ID)).resolves.toEqual({
      error: 'You can only modify your own messages',
    });
    expect(publishRealtimeEvent).not.toHaveBeenCalled();
  });
});

describe('getChatList', () => {
  it('maps the single aggregate query into chat list items', async () => {
    const db = installDb({
      chatList: [
        makeChatRow({ unread_count: '2' }),
        makeChatRow({
          id: '99999999-9999-4999-8999-999999999999',
          type: 'group',
          name: 'Solo',
          other_user: null,
          last_message: null,
          unread_count: 0,
        }),
      ],
    });

    const result = await getChatList();

    expect(result.error).toBeUndefined();
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({
      otherUser: { id: OTHER_ID },
      lastMessage: { content: 'newest' },
      unreadCount: 2,
    });
    expect(result.data[0].conversation.id).toBe(CONV_ID);
    expect(result.data[1]).toMatchObject({
      otherUser: null,
      lastMessage: null,
      unreadCount: 0,
    });

    expect(db.calls).toHaveLength(1);
    expect(db.find('WITH my_memberships AS (')?.params).toEqual([USER_ID]);
  });

  it('never issues a query per conversation', async () => {
    const db = installDb({
      chatList: [
        makeChatRow(),
        makeChatRow({ id: '99999999-9999-4999-8999-999999999999' }),
      ],
    });

    const result = await getChatList();

    expect(result.data).toHaveLength(2);
    expect(db.calls).toHaveLength(1);
  });

  it('returns empty data for users without conversations', async () => {
    installDb({ chatList: [] });

    await expect(getChatList()).resolves.toEqual({ data: [] });
  });

  it('returns aggregate query errors', async () => {
    installDb({ fail: ['chat-list'] });

    await expect(getChatList()).resolves.toEqual({
      error: 'chat list failed',
      data: [],
    });
  });
});

describe('markAsRead', () => {
  it('checks membership before updating last_read_at', async () => {
    const db = installDb();

    await expect(markAsRead(CONV_ID)).resolves.toEqual({ success: true });

    expect(db.find('SELECT EXISTS (')?.params).toEqual([CONV_ID, USER_ID]);
    expect(db.find('UPDATE public.conversation_members')?.params).toEqual([
      CONV_ID,
      USER_ID,
    ]);
  });

  it('does not update when the user is not a member', async () => {
    const db = installDb({ isMember: false });

    await expect(markAsRead(CONV_ID)).resolves.toEqual({
      error: 'You are not a member of this conversation',
    });
    expect(db.find('UPDATE public.conversation_members')).toBeUndefined();
  });

  it('rejects invalid conversation ids', async () => {
    const db = installDb();

    await expect(markAsRead('nope')).resolves.toEqual({
      error: 'Invalid identifier',
    });
    expect(db.calls).toHaveLength(0);
  });
});

describe('getOrCreateConversation', () => {
  it('rejects conversations with yourself', async () => {
    const db = installDb();

    await expect(getOrCreateConversation(USER_ID)).resolves.toEqual({
      error: 'Cannot create a conversation with yourself',
    });
    expect(db.calls).toHaveLength(0);
  });

  it('calls the SQL function and publishes a conversation update', async () => {
    const db = installDb({ participantIds: [USER_ID, OTHER_ID] });

    await expect(getOrCreateConversation(OTHER_ID)).resolves.toEqual({
      conversationId: CONV_ID,
    });

    expect(db.find('get_or_create_private_conversation')?.params).toEqual([
      USER_ID,
      OTHER_ID,
    ]);
    expect(db.find('ORDER BY joined_at, id')?.params).toEqual([CONV_ID]);
    expect(publishRealtimeEvent).toHaveBeenCalledWith({
      type: 'conversation:update',
      conversationId: CONV_ID,
      participantIds: [USER_ID, OTHER_ID],
    });
  });

  it('returns SQL function errors', async () => {
    installDb({ fail: ['rpc'] });

    await expect(getOrCreateConversation(OTHER_ID)).resolves.toEqual({
      error: 'rpc failed',
    });
    expect(publishRealtimeEvent).not.toHaveBeenCalled();
  });
});

describe('searchUsers', () => {
  it('binds an escaped ILIKE pattern without interpolating the term', async () => {
    const db = installDb({
      users: [makeProfile(OTHER_ID, 'Saitama', 'saitama@example.com')],
    });

    const result = await searchUsers('a%b_c,(d)');

    expect(result.error).toBeUndefined();
    expect(result.data).toHaveLength(1);

    const searchCall = db.find('FROM public.users u');
    expect(searchCall?.params).toEqual([USER_ID, '%a\\%b\\_c d%']);
    expect(searchCall?.text).not.toContain('a%b');
    expect(searchCall?.text).toContain('$2');
  });

  it('returns query errors', async () => {
    installDb({ fail: ['user-search'] });

    await expect(searchUsers('saitama')).resolves.toEqual({
      error: 'user search failed',
      data: [],
    });
  });

  it('skips short keywords', async () => {
    const db = installDb();

    await expect(searchUsers('a')).resolves.toEqual({ data: [] });
    expect(db.calls).toHaveLength(0);
  });

  it('skips terms that sanitize below the minimum length', async () => {
    const db = installDb();

    await expect(searchUsers('(a)')).resolves.toEqual({ data: [] });
    expect(db.calls).toHaveLength(0);
  });

  it('requires authentication', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    installDb();

    await expect(searchUsers('saitama')).resolves.toEqual({
      error: 'Not authenticated',
      data: [],
    });
  });
});

describe('searchMessages', () => {
  it('binds an escaped ILIKE pattern and scopes to memberships in SQL', async () => {
    const message = makeMessageWithSender({ content: '50% off' });
    const db = installDb({ searchResults: [message] });

    const result = await searchMessages('50%_off');

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual([message]);

    const searchCall = db.find('m.content ILIKE $2');
    expect(searchCall?.params).toEqual([USER_ID, '%50\\%\\_off%']);
    expect(searchCall?.text).not.toContain('50%');
    expect(searchCall?.text).toContain('public.conversation_members');
    expect(searchCall?.text).toContain('m.is_deleted = FALSE');
  });

  it('returns query errors', async () => {
    installDb({ fail: ['message-search'] });

    await expect(searchMessages('saitama')).resolves.toEqual({
      error: 'message search failed',
      data: [],
    });
  });

  it('skips short keywords', async () => {
    const db = installDb();

    await expect(searchMessages('a')).resolves.toEqual({ data: [] });
    expect(db.calls).toHaveLength(0);
  });

  it('requires authentication', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    installDb();

    await expect(searchMessages('saitama')).resolves.toEqual({
      error: 'Not authenticated',
      data: [],
    });
  });
});
