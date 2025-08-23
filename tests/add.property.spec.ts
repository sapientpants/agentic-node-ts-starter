import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { add } from '../src/index';

describe('add (property-based)', () => {
  it('is commutative: a+b === b+a', () => {
    fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => add(a, b) === add(b, a)));
  });

  it('has identity element 0', () => {
    fc.assert(fc.property(fc.integer(), (a) => add(a, 0) === a));
  });
});
