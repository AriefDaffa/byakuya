import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export type SignUpResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  autoSignedIn?: boolean;
};

const DEFAULT_REDIRECT_PATH = '/';

/**
 * Returns a same-origin relative redirect path.
 *
 * Anything that could escape the application origin (absolute URLs,
 * protocol-relative URLs, backslash tricks or embedded credentials) falls back
 * to `/`. Values that are not strings starting with a single `/` are rejected.
 */
export function sanitizeRedirectPath(next: string | null | undefined): string {
  if (!next) return DEFAULT_REDIRECT_PATH;

  // Browsers may normalize backslashes and strip whitespace/control characters,
  // which can turn `/\evil.com` into `//evil.com`.
  if (/[\u0000-\u001f\u007f\s\\]/.test(next)) return DEFAULT_REDIRECT_PATH;
  if (!next.startsWith('/')) return DEFAULT_REDIRECT_PATH;
  if (next.startsWith('//')) return DEFAULT_REDIRECT_PATH;
  if (next.includes('@')) return DEFAULT_REDIRECT_PATH;

  // Reject paths that smuggle an absolute scheme right after the leading slash.
  if (/^[a-z][a-z0-9+.-]*:/i.test(next.slice(1))) return DEFAULT_REDIRECT_PATH;

  return next;
}
