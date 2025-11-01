/**
 * ============================================================================
 * EXAMPLE TEST - REMOVE OR REPLACE THIS FILE
 * ============================================================================
 * This test file demonstrates property-based testing patterns for example code.
 * It should be removed or replaced with tests for your actual application.
 *
 * See docs/GETTING_STARTED.md#clean-up-example-code for cleanup instructions.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { add } from '../src/index.js';

describe('add (property-based)', () => {
  it('is commutative: a+b === b+a', () => {
    const result = fc.check(
      fc.property(fc.integer(), fc.integer(), (a, b) => add(a, b) === add(b, a)),
    );
    expect(result.failed).toBe(false);
  });

  it('has identity element 0', () => {
    const result = fc.check(fc.property(fc.integer(), (a) => add(a, 0) === a));
    expect(result.failed).toBe(false);
  });
});
