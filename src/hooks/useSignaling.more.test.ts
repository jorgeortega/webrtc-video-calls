import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

// Basic smoke test for API shape — more detailed signaling behavior is covered elsewhere.
import { useSignaling } from './useSignaling';

test('returns signaling controls', () => {
  const { result } = renderHook(() => useSignaling({ onMessage: () => {} }));
  expect(typeof result.current.connect).toBe('function');
  expect(typeof result.current.disconnect).toBe('function');
  expect(typeof result.current.send).toBe('function');
});
