import { z } from 'zod';

export const ZRegisterTypes = z.object({
  name: z.string().min(1, { message: 'Minimum 1 characters' }),
  email: z.string().min(1, { message: 'Minimum 1 characters' }),
  password: z.string().min(8, { message: 'Minimum 8 characters' }),
});
