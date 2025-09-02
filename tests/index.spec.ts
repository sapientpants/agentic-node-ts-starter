/**
 * ============================================================================
 * EXAMPLE TEST - REMOVE OR REPLACE THIS FILE
 * ============================================================================
 * This test file demonstrates testing patterns for the example code.
 * It should be removed or replaced with tests for your actual application.
 *
 * See docs/GETTING_STARTED.md#clean-up-example-code for cleanup instructions.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { add } from '../src/index.js';

describe('add', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});
