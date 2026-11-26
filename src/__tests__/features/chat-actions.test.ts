/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import {
  deleteMessage,
  editMessage,
  getChatList,
  getMessages,
  markAsRead,
  searchMessages,
  searchUsers,
  sendAttachment,
  sendMessage,
} from '@/features/chat/actions';
import {
  MAX_ATTACHMENT_BYTES,
  attachmentFileSchema,
  messageContentSchema,
  paginationSchema,
  searchKeywordSchema,
} from '@/features/chat/schemas';
import type { Attachment, Conversation, Message, Profile } from '@/types/database';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';
const CONV_ID = '33333333-3333-4333-8333-333333333333';
const MESSAGE_ID = '44444444-4444-4444-8444-444444444444';
const ATTACHMENT_ID = '66666666-6666-4666-8666-666666666666';
const RANDOM_UUID = '55555555-5555-4555-8555-555555555555';
const CREATED_AT = '2026-01-01T00:00:00.000Z';

interface MockResult {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
}

interface MockQuery {
  table: string;
  calls: Array<[string, unknown[]]>;
  builder: any;
}

interface MockClientOptions {
  user?: { id: string } | null;
  tables?: Record<string, MockResult[]>;
  storage?: {
    upload?: MockResult;
    createSignedUrl?: MockResult | MockResult[];
    remove?: MockResult;
  };
}

function normalizeResult(result: MockResult) {
  return {
    data: result.data ?? null,
    error: result.error ?? null,
    count: result.count ?? null,
  };
}

function createQueryBuilder(table: string, result: MockResult, queries: MockQuery[]) {
  const calls: Array<[string, unknown[]]> = [];
  const builder: any = {};

  const chainable = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'ilike',
    'or',
    'order',
    'range',
    'limit',
    'gt',
    'gte',
    'lt',
  ];

  for (const method of chainable) {
    builder[method] = vi.fn((...args: unknown[]) => {
      calls.push([method, args]);
      return builder;
    });
  }

  builder.single = vi.fn((...args: unknown[]) => {
    calls.push(['single', args]);
    return Promise.resolve(normalizeResult(result));
  });

  builder.maybeSingle = vi.fn((...args: unknown[]) => {
    calls.push(['maybeSingle', args]);
    return Promise.resolve(normalizeResult(result));
  });

  builder.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected: (reason: unknown) => unknown,
  ) => Promise.resolve(normalizeResult(result)).then(onFulfilled, onRejected);

  queries.push({ table, calls, builder });

  return builder;
}

function createMockClient(options: MockClientOptions = {}) {
  const queues = new Map<string, MockResult[]>();
  for (const [table, results] of Object.entries(options.tables ?? {})) {
    queues.set(table, [...results]);
  }

  const queries: MockQuery[] = [];
  const from = vi.fn((table: string) => {
    const queue = queues.get(table);
    if (!queue || queue.length === 0) {
      throw new Error(`Unexpected query for table "${table}"`);
    }

    return createQueryBuilder(table, queue.shift()!, queries);
  });

  const signedUrlQueue = Array.isArray(options.storage?.createSignedUrl)
    ? [...options.storage.createSignedUrl]
    : null;
  const defaultSignedUrl = Array.isArray(options.storage?.createSignedUrl)
    ? undefined
    : (options.storage?.createSignedUrl ?? {
        data: { signedUrl: 'https://signed/default' },
        error: null,
      });

  const storageApi = {
    upload: vi
      .fn()
      .mockResolvedValue(
        options.storage?.upload ?? { data: { path: 'uploaded' }, error: null },
      ),
    createSignedUrl: vi.fn((_path: string, _expiresIn: number) => {
      const result = signedUrlQueue?.shift() ?? defaultSignedUrl;
      return Promise.resolve(result);
    }),
    remove: vi
      .fn()
      .mockResolvedValue(options.storage?.remove ?? { data: [], error: null }),
    getPublicUrl: vi.fn(),
  };

  const storage = { from: vi.fn(() => storageApi) };
  const auth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: options.user ?? null },
      error: null,
    }),
  };

  return {
    client: { from, storage, auth },
    queries,
    storageApi,
  };
}

function useMockClient(mock: ReturnType<typeof createMockClient>) {
  vi.mocked(createClient).mockResolvedValue(mock.client as never);
}

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

function makeAttachment(overrides: Partial<Attachment> = {}): Attachment {
  return {
    id: ATTACHMENT_ID,
    message_id: MESSAGE_ID,
    file_name: 'note.txt',
    file_type: 'text/plain',
    file_size: 120,
    file_url: 'https://stored/default',
    storage_path: `${CONV_ID}/stored.txt`,
    created_at: CREATED_AT,
    ...overrides,
  };
}

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: CONV_ID,
    type: 'private',
    name: null,
    avatar_url: null,
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
    ...overrides,
  };
}

function memberResult() {
  return { data: { conversation_id: CONV_ID }, error: null };
}

beforeEach(() => {
  vi.stubGlobal('crypto', {
    randomUUID: vi.fn(() => RANDOM_UUID),
  });
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

describe('sendMessage', () => {
  it('rejects unauthenticated users', async () => {
    const mock = createMockClient({ user: null });
    useMockClient(mock);

    await expect(sendMessage(CONV_ID, 'hello')).resolves.toEqual({
      error: 'Not authenticated',
    });
    expect(mock.client.from).not.toHaveBeenCalled();
  });

  it('rejects empty content before querying', async () => {
    const mock = createMockClient({ user: { id: USER_ID } });
    useMockClient(mock);

    await expect(sendMessage(CONV_ID, '   ')).resolves.toEqual({
      error: 'Message cannot be empty',
    });
    expect(mock.client.from).not.toHaveBeenCalled();
  });

  it('checks membership and inserts a trimmed message', async () => {
    const message = makeMessage({ content: 'hello' });
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [memberResult()],
        messages: [
          {
            data: {
              ...message,
              sender: makeProfile(USER_ID, 'Arief', 'arief@example.com'),
            },
            error: null,
          },
        ],
      },
    });
    useMockClient(mock);

    const result = await sendMessage(CONV_ID, '  hello  ');

    expect('data' in result).toBe(true);
    const messagesQuery = mock.queries.find((query) => query.table === 'messages');
    expect(messagesQuery).toBeDefined();

    const insertCall = messagesQuery!.calls.find(([method]) => method === 'insert');
    expect(insertCall?.[1][0]).toMatchObject({
      conversation_id: CONV_ID,
      sender_id: USER_ID,
      content: 'hello',
      type: 'text',
    });
  });

  it('rejects non-members', async () => {
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [{ data: null, error: null }],
      },
    });
    useMockClient(mock);

    await expect(sendMessage(CONV_ID, 'hello')).resolves.toEqual({
      error: 'You are not a member of this conversation',
    });
  });
});

describe('sendAttachment', () => {
  it('rejects files over 2MB before touching storage', async () => {
    const mock = createMockClient({ user: { id: USER_ID } });
    useMockClient(mock);

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
    expect(mock.storageApi.upload).not.toHaveBeenCalled();
  });

  it('uploads, inserts the message and returns the real attachment row', async () => {
    const file = new File(['hello'], 'note.txt', { type: 'text/plain' });
    const message = makeMessage({ content: 'A caption', type: 'file' });
    const attachment = makeAttachment({
      file_url: 'https://signed/default',
    });

    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [memberResult()],
        messages: [
          {
            data: {
              ...message,
              sender: makeProfile(USER_ID, 'Arief', 'arief@example.com'),
            },
            error: null,
          },
        ],
        attachments: [{ data: attachment, error: null }],
      },
    });
    useMockClient(mock);

    const formData = new FormData();
    formData.append('file', file);

    const result = await sendAttachment(CONV_ID, formData, 'A caption');

    expect('data' in result).toBe(true);
    if (!('data' in result) || !result.data) {
      throw new Error('Expected attachment data');
    }

    const storagePath = `${CONV_ID}/${RANDOM_UUID}.txt`;
    expect(mock.storageApi.upload).toHaveBeenCalledWith(storagePath, file, {
      contentType: 'text/plain',
      upsert: false,
    });
    expect(mock.storageApi.createSignedUrl).toHaveBeenCalledWith(storagePath, 3600);
    expect(result.data.attachments).toEqual([attachment]);

    const attachmentQuery = mock.queries.find((query) => query.table === 'attachments');
    const insertCall = attachmentQuery!.calls.find(([method]) => method === 'insert');
    expect(insertCall?.[1][0]).toMatchObject({
      message_id: MESSAGE_ID,
      file_name: 'note.txt',
      file_type: 'text/plain',
      file_size: file.size,
      file_url: 'https://signed/default',
      storage_path: storagePath,
    });
  });

  it('rolls back storage and the message when the attachment row fails', async () => {
    const file = new File(['hello'], 'note.txt', { type: 'text/plain' });
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [memberResult()],
        messages: [
          {
            data: {
              ...makeMessage({ content: 'note.txt' }),
              sender: makeProfile(USER_ID, 'Arief', 'arief@example.com'),
            },
            error: null,
          },
          { data: null, error: null },
        ],
        attachments: [{ data: null, error: { message: 'insert failed' } }],
      },
    });
    useMockClient(mock);

    const formData = new FormData();
    formData.append('file', file);

    await expect(sendAttachment(CONV_ID, formData)).resolves.toEqual({
      error: 'insert failed',
    });

    const storagePath = `${CONV_ID}/${RANDOM_UUID}.txt`;
    expect(mock.storageApi.remove).toHaveBeenCalledWith([storagePath]);

    const messagesQueries = mock.queries.filter((query) => query.table === 'messages');
    const rollbackQuery = messagesQueries[messagesQueries.length - 1];
    expect(rollbackQuery.calls.some(([method]) => method === 'delete')).toBe(true);
    expect(rollbackQuery.calls).toContainEqual(['eq', ['id', MESSAGE_ID]]);
  });
});

describe('getMessages', () => {
  it('requires authentication', async () => {
    const mock = createMockClient({ user: null });
    useMockClient(mock);

    const result = await getMessages(CONV_ID, 1);
    expect(result.error).toBe('Not authenticated');
    expect(mock.client.from).not.toHaveBeenCalled();
  });

  it('embeds attachments and returns signed URLs', async () => {
    const attachment = makeAttachment();
    const message = makeMessage();

    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [memberResult()],
        messages: [
          {
            data: [
              {
                ...message,
                sender: makeProfile(USER_ID, 'Arief', 'arief@example.com'),
                attachments: [attachment],
              },
            ],
            error: null,
            count: 1,
          },
        ],
      },
    });
    useMockClient(mock);

    const result = await getMessages(CONV_ID, 1);

    expect(result.error).toBeUndefined();
    expect(result.totalPages).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].attachments?.[0].file_url).toBe('https://signed/default');
    expect(mock.storageApi.createSignedUrl).toHaveBeenCalledWith(
      attachment.storage_path,
      3600,
    );

    const messagesQuery = mock.queries.find((query) => query.table === 'messages');
    const selectCall = messagesQuery!.calls.find(([method]) => method === 'select');
    expect(String(selectCall?.[1][0])).toContain('attachments(*)');
  });

  it('rejects non-members', async () => {
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [{ data: null, error: null }],
      },
    });
    useMockClient(mock);

    const result = await getMessages(CONV_ID, 1);
    expect(result.error).toBe('You are not a member of this conversation');
  });
});

describe('editMessage', () => {
  it('updates only an owned message', async () => {
    const updated = makeMessage({ content: 'updated', is_edited: true });
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        messages: [
          {
            data: {
              id: MESSAGE_ID,
              conversation_id: CONV_ID,
              sender_id: USER_ID,
            },
            error: null,
          },
          {
            data: {
              ...updated,
              sender: makeProfile(USER_ID, 'Arief', 'arief@example.com'),
            },
            error: null,
          },
        ],
        conversation_members: [memberResult()],
      },
    });
    useMockClient(mock);

    const result = await editMessage(MESSAGE_ID, '  updated  ');

    expect('data' in result).toBe(true);
    const updateQuery = mock.queries.filter((query) => query.table === 'messages')[1];
    const updateCall = updateQuery.calls.find(([method]) => method === 'update');
    expect(updateCall?.[1][0]).toMatchObject({
      content: 'updated',
      is_edited: true,
    });
  });

  it('rejects messages owned by someone else', async () => {
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        messages: [
          {
            data: {
              id: MESSAGE_ID,
              conversation_id: CONV_ID,
              sender_id: OTHER_ID,
            },
            error: null,
          },
        ],
      },
    });
    useMockClient(mock);

    await expect(editMessage(MESSAGE_ID, 'nope')).resolves.toEqual({
      error: 'You can only modify your own messages',
    });
  });
});

describe('deleteMessage', () => {
  it('soft-deletes an owned message', async () => {
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        messages: [
          {
            data: {
              id: MESSAGE_ID,
              conversation_id: CONV_ID,
              sender_id: USER_ID,
            },
            error: null,
          },
          { data: null, error: null },
        ],
        conversation_members: [memberResult()],
      },
    });
    useMockClient(mock);

    await expect(deleteMessage(MESSAGE_ID)).resolves.toEqual({ success: true });

    const updateQuery = mock.queries.filter((query) => query.table === 'messages')[1];
    const updateCall = updateQuery.calls.find(([method]) => method === 'update');
    expect(updateCall?.[1][0]).toMatchObject({
      is_deleted: true,
      content: null,
    });
  });
});

describe('getChatList', () => {
  it('batch-loads members, messages and unread counts without N+1 queries', async () => {
    const me = makeProfile(USER_ID, 'Arief', 'arief@example.com');
    const other = makeProfile(OTHER_ID, 'Saitama', 'saitama@example.com');
    const conversation = makeConversation();

    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [
          {
            data: [
              {
                conversation_id: CONV_ID,
                last_read_at: '2026-01-01T00:00:00.000Z',
                joined_at: '2025-12-01T00:00:00.000Z',
              },
            ],
            error: null,
          },
          {
            data: [
              {
                conversation_id: CONV_ID,
                user_id: USER_ID,
                last_read_at: '2026-01-01T00:00:00.000Z',
                profiles: me,
              },
              {
                conversation_id: CONV_ID,
                user_id: OTHER_ID,
                last_read_at: null,
                profiles: other,
              },
            ],
            error: null,
          },
        ],
        conversations: [{ data: [conversation], error: null }],
        messages: [
          {
            data: [
              makeMessage({
                id: '77777777-7777-4777-8777-777777777777',
                sender_id: OTHER_ID,
                content: 'newest',
                created_at: '2026-01-01T00:20:00.000Z',
              }),
              makeMessage({
                id: '88888888-8888-4888-8888-888888888888',
                sender_id: OTHER_ID,
                content: 'unread too',
                created_at: '2026-01-01T00:10:00.000Z',
              }),
              makeMessage({
                id: '99999999-9999-4999-8999-999999999999',
                sender_id: USER_ID,
                content: 'mine',
                created_at: '2026-01-01T00:05:00.000Z',
              }),
              makeMessage({
                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                sender_id: OTHER_ID,
                content: 'old',
                created_at: '2025-12-31T23:00:00.000Z',
              }),
            ],
            error: null,
          },
        ],
      },
    });
    useMockClient(mock);

    const result = await getChatList();

    expect(result.error).toBeUndefined();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].otherUser?.id).toBe(OTHER_ID);
    expect(result.data[0].lastMessage?.content).toBe('newest');
    expect(result.data[0].unreadCount).toBe(2);

    expect(mock.client.from).toHaveBeenCalledTimes(4);
    expect(
      mock.client.from.mock.calls.filter(([table]) => table === 'messages'),
    ).toHaveLength(1);
  });

  it('keeps otherUser null for conversations without another member', async () => {
    const me = makeProfile(USER_ID, 'Arief', 'arief@example.com');
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [
          {
            data: [
              {
                conversation_id: CONV_ID,
                last_read_at: null,
                joined_at: CREATED_AT,
              },
            ],
            error: null,
          },
          {
            data: [
              {
                conversation_id: CONV_ID,
                user_id: USER_ID,
                last_read_at: null,
                profiles: me,
              },
            ],
            error: null,
          },
        ],
        conversations: [
          { data: [makeConversation({ type: 'group', name: 'Solo' })], error: null },
        ],
        messages: [{ data: [], error: null }],
      },
    });
    useMockClient(mock);

    const result = await getChatList();

    expect(result.data[0].otherUser).toBeNull();
    expect(result.data[0].lastMessage).toBeNull();
    expect(result.data[0].unreadCount).toBe(0);
  });

  it('returns an error when a batched query fails', async () => {
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [
          {
            data: [
              { conversation_id: CONV_ID, last_read_at: null, joined_at: CREATED_AT },
            ],
            error: null,
          },
        ],
        conversations: [{ data: null, error: { message: 'db down' } }],
      },
    });
    useMockClient(mock);

    const result = await getChatList();
    expect(result).toEqual({ error: 'db down', data: [] });
  });
});

describe('markAsRead', () => {
  it('checks membership before updating last_read_at', async () => {
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [memberResult(), { data: null, error: null }],
      },
    });
    useMockClient(mock);

    await expect(markAsRead(CONV_ID)).resolves.toEqual({ success: true });

    const updateQuery = mock.queries.filter(
      (query) => query.table === 'conversation_members',
    )[1];
    const updateCall = updateQuery.calls.find(([method]) => method === 'update');
    expect(updateCall?.[1][0]).toHaveProperty('last_read_at');
    expect(updateQuery.calls).toContainEqual(['eq', ['conversation_id', CONV_ID]]);
    expect(updateQuery.calls).toContainEqual(['eq', ['user_id', USER_ID]]);
  });

  it('does not update when the user is not a member', async () => {
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [{ data: null, error: null }],
      },
    });
    useMockClient(mock);

    await expect(markAsRead(CONV_ID)).resolves.toEqual({
      error: 'You are not a member of this conversation',
    });
    expect(mock.client.from).toHaveBeenCalledTimes(1);
  });
});

describe('searchUsers', () => {
  it('escapes wildcards, strips filter syntax and excludes the current user', async () => {
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        profiles: [
          {
            data: [makeProfile(OTHER_ID, 'Saitama', 'saitama@example.com')],
            error: null,
          },
        ],
      },
    });
    useMockClient(mock);

    const result = await searchUsers('a%b_c,(d)');

    expect(result.error).toBeUndefined();
    expect(result.data).toHaveLength(1);

    const profileQuery = mock.queries.find((query) => query.table === 'profiles');
    expect(profileQuery?.calls).toContainEqual(['neq', ['id', USER_ID]]);

    const orCall = profileQuery?.calls.find(([method]) => method === 'or');
    const filter = String(orCall?.[1][0]);
    expect(filter).toContain('a\\%b\\_c d');
    expect(filter).not.toContain('(');
    expect(filter).not.toContain(')');
  });

  it('returns query errors', async () => {
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        profiles: [{ data: null, error: { message: 'search failed' } }],
      },
    });
    useMockClient(mock);

    await expect(searchUsers('saitama')).resolves.toEqual({
      error: 'search failed',
      data: [],
    });
  });

  it('skips short keywords', async () => {
    const mock = createMockClient({ user: { id: USER_ID } });
    useMockClient(mock);

    await expect(searchUsers('a')).resolves.toEqual({ data: [] });
    expect(mock.client.from).not.toHaveBeenCalled();
  });
});

describe('searchMessages', () => {
  it('escapes wildcards and filters deleted messages', async () => {
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [{ data: [{ conversation_id: CONV_ID }], error: null }],
        messages: [{ data: [makeMessage()], error: null }],
      },
    });
    useMockClient(mock);

    const result = await searchMessages('50%_off');

    expect(result.error).toBeUndefined();
    expect(result.data).toHaveLength(1);

    const messagesQuery = mock.queries.find((query) => query.table === 'messages');
    expect(messagesQuery?.calls).toContainEqual(['eq', ['is_deleted', false]]);
    expect(messagesQuery?.calls).toContainEqual(['ilike', ['content', '%50\\%\\_off%']]);
  });

  it('returns membership lookup errors', async () => {
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [{ data: null, error: { message: 'membership failed' } }],
      },
    });
    useMockClient(mock);

    await expect(searchMessages('saitama')).resolves.toEqual({
      error: 'membership failed',
      data: [],
    });
  });

  it('returns empty results when the user has no conversations', async () => {
    const mock = createMockClient({
      user: { id: USER_ID },
      tables: {
        conversation_members: [{ data: [], error: null }],
      },
    });
    useMockClient(mock);

    await expect(searchMessages('saitama')).resolves.toEqual({ data: [] });
    expect(mock.client.from).toHaveBeenCalledTimes(1);
  });
});
