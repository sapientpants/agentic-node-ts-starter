import { createChildLogger } from './logger.js';

const logger = createChildLogger('index');

export function add(a: number, b: number): number {
  logger.debug({ a, b }, 'Adding two numbers');
  const result = a + b;
  logger.debug({ result }, 'Addition result');
  return result;
}

// Example of a zod-validated function input
import { z } from 'zod';
export const CreateUser = z.object({
  id: z.string().uuid({ message: 'Invalid UUID format' }),
  email: z.string().email({ message: 'Invalid email format' }),
  age: z.number().int().min(13),
});
export type CreateUser = z.infer<typeof CreateUser>;
