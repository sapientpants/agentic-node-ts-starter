import { describe, it, expect } from 'vitest';
import { add } from '../src/index.js';

describe('add', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});
