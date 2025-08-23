export function add(a: number, b: number): number {
  return a + b;
}

// Example of a zod-validated function input
import { z } from 'zod';
export const CreateUser = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().min(13)
});
export type CreateUser = z.infer<typeof CreateUser>;
