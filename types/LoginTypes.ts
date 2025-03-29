import { z } from 'zod';

export const ZLoginTypes = z.object({
  email: z.string().min(1, { message: 'Minimum 1 characters' }),
  password: z.string().min(8, { message: 'Minimum  characters' }),
});
