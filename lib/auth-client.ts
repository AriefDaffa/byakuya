import { createAuthClient } from 'better-auth/react';

console.log('test-log', process.env.NEXT_PUBLIC_BETTER_AUTH_URL);

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});
