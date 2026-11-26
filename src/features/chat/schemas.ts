import { z } from 'zod';

export const MESSAGES_PER_PAGE = 30;
export const MAX_PAGE_SIZE = 100;
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_SEARCH_LENGTH = 100;
export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
export const ATTACHMENT_URL_EXPIRY_SECONDS = 3600;

/** Any database identifier exposed to a server action must be a real UUID. */
export const uuidSchema = z.string().uuid('Invalid identifier');

export const conversationIdSchema = uuidSchema;
export const messageIdSchema = uuidSchema;
export const userIdSchema = uuidSchema;

/** Trimmed, non-empty message text with a hard upper bound. */
export const messageContentSchema = z
  .string()
  .trim()
  .min(1, 'Message cannot be empty')
  .max(MAX_MESSAGE_LENGTH, `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);

/** Page number used by the paginated message list. */
export const pageSchema = z.coerce
  .number()
  .int('Page must be an integer')
  .min(1, 'Page must be at least 1')
  .default(1);

/** Generic pagination window (limit + offset), useful for future callers. */
export const paginationSchema = z.object({
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(MAX_PAGE_SIZE, `Limit cannot exceed ${MAX_PAGE_SIZE}`)
    .default(MESSAGES_PER_PAGE),
  offset: z.coerce
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .default(0),
});

/** Search keywords are trimmed and must be at least two characters. */
export const searchKeywordSchema = z
  .string()
  .trim()
  .min(2, 'Search requires at least 2 characters')
  .max(MAX_SEARCH_LENGTH, `Search cannot exceed ${MAX_SEARCH_LENGTH} characters`);

/** Resolve a 1-based page number into a limit/offset window. */
export function getPagination(page: number): {
  page: number;
  limit: number;
  offset: number;
} {
  const parsedPage = pageSchema.safeParse(page);
  const currentPage = parsedPage.success ? parsedPage.data : 1;
  const { limit, offset } = paginationSchema.parse({
    limit: MESSAGES_PER_PAGE,
    offset: (currentPage - 1) * MESSAGES_PER_PAGE,
  });

  return { page: currentPage, limit, offset };
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'text/rtf',
]);

/**
 * Images are allowed, except SVG because it can embed executable markup.
 * Everything else must be an explicit attachment type.
 */
export function isAllowedAttachmentMimeType(mimeType: string): boolean {
  if (mimeType.startsWith('image/')) {
    return mimeType !== 'image/svg+xml';
  }

  return ALLOWED_MIME_TYPES.has(mimeType);
}

/** Server-side file validation. The FormData value is untrusted input. */
export const attachmentFileSchema = z
  .custom<File>((value) => typeof File !== 'undefined' && value instanceof File, {
    message: 'No file provided',
  })
  .superRefine((file, context) => {
    if (file.size === 0) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'File is empty' });
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File must be 2MB or smaller',
      });
    }

    if (!isAllowedAttachmentMimeType(file.type)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File type is not allowed',
      });
    }
  });

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input';
}

/**
 * PostgREST filter strings use commas and parentheses as syntax. Strip those
 * characters from user-provided terms before embedding them into a filter.
 */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[(),]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Escape LIKE/ILIKE wildcards so search terms are matched literally. */
export function escapeLikeTerm(term: string): string {
  return term.replace(/\\/g, '\\\\').replace(/[%_*]/g, (character) => `\\${character}`);
}

/** Build a safe `%term%` ILIKE pattern. */
export function toIlikePattern(term: string): string {
  return `%${escapeLikeTerm(term)}%`;
}
