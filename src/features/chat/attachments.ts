import type { SupabaseClient } from '@supabase/supabase-js';
import type { Attachment, Database } from '@/types/database';
import { ATTACHMENT_URL_EXPIRY_SECONDS } from './schemas';

export const ATTACHMENTS_BUCKET = 'attachments';

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

export async function createAttachmentSignedUrl(
  supabase: SupabaseClient<Database>,
  storagePath: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, ATTACHMENT_URL_EXPIRY_SECONDS);

  if (error || !data) return null;
  return data.signedUrl;
}

export async function removeAttachmentObject(
  supabase: SupabaseClient<Database>,
  storagePath: string,
): Promise<void> {
  await supabase.storage.from(ATTACHMENTS_BUCKET).remove([storagePath]);
}

/** Replace the stored URL with a fresh signed URL for display/download. */
export async function withSignedAttachmentUrl(
  supabase: SupabaseClient<Database>,
  attachment: Attachment,
): Promise<Attachment> {
  const signedUrl = await createAttachmentSignedUrl(supabase, attachment.storage_path);

  if (!signedUrl) return attachment;
  return { ...attachment, file_url: signedUrl };
}

export async function signAttachments(
  supabase: SupabaseClient<Database>,
  attachments: Attachment[] | null | undefined,
): Promise<Attachment[]> {
  if (!attachments?.length) return [];

  return Promise.all(
    attachments.map((attachment) => withSignedAttachmentUrl(supabase, attachment)),
  );
}
