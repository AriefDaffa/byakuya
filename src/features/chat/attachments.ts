import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Attachment } from '@/types/database';

const MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'text/rtf': 'rtf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

/** Root directory for locally stored uploads. Read lazily so tests can override it. */
export function getUploadDir(): string {
  return process.env.UPLOAD_DIR || './uploads';
}

/** Prefer the original extension, but never trust it as a path fragment. */
export function getFileExtension(fileName: string, mimeType: string): string {
  const nameExtension = fileName
    .split('.')
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (nameExtension && nameExtension.length <= 10) {
    return nameExtension;
  }

  return MIME_EXTENSIONS[mimeType] ?? 'bin';
}

/** Storage layout: `<conversationId>/<uuid>.<extension>`. */
export function createAttachmentStoragePath(
  conversationId: string,
  fileName: string,
  mimeType: string,
): string {
  return `${conversationId}/${crypto.randomUUID()}.${getFileExtension(fileName, mimeType)}`;
}

/** Public (authenticated) URL used to stream an attachment through the app. */
export function getAttachmentUrl(attachmentId: string): string {
  return `/api/attachments/${attachmentId}`;
}

/**
 * Resolve a database `storage_path` to an absolute path inside `UPLOAD_DIR`.
 * Returns `null` when the path is empty or escapes the upload directory.
 */
export function resolveLocalAttachmentPath(storagePath: string): string | null {
  if (!storagePath) return null;

  const normalized = storagePath.replace(/\\/g, '/');
  if (normalized.split('/').some((segment) => segment === '..')) return null;

  const root = path.resolve(getUploadDir());
  const absolute = path.resolve(root, normalized);
  const relative = path.relative(root, absolute);

  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }

  return absolute;
}

/** Persist an uploaded file under `UPLOAD_DIR/<storagePath>`. */
export async function saveLocalAttachment(
  storagePath: string,
  data: Buffer | Uint8Array,
): Promise<string> {
  const absolutePath = resolveLocalAttachmentPath(storagePath);
  if (!absolutePath) {
    throw new Error('Invalid attachment path');
  }

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, data);

  return storagePath;
}

/** Read an attachment for the authenticated streaming route. */
export async function readLocalAttachment(storagePath: string): Promise<Buffer> {
  const absolutePath = resolveLocalAttachmentPath(storagePath);
  if (!absolutePath) {
    throw new Error('Invalid attachment path');
  }

  return readFile(absolutePath);
}

/** Roll back a file written before the database row was committed. */
export async function deleteLocalAttachment(storagePath: string): Promise<void> {
  const absolutePath = resolveLocalAttachmentPath(storagePath);
  if (!absolutePath) return;

  try {
    await unlink(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/** Build the attachment row shape returned alongside messages. */
export function buildAttachmentRow(params: {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  createdAt: string;
}): Attachment {
  return {
    id: params.id,
    message_id: params.messageId,
    file_name: params.fileName,
    file_type: params.fileType,
    file_size: params.fileSize,
    file_url: getAttachmentUrl(params.id),
    storage_path: params.storagePath,
    created_at: params.createdAt,
  };
}
