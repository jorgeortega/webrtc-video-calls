import { renderHook } from '@testing-library/react';

import { useSignaling } from './useSignaling';

test('returns signaling controls', () => {
  const { result } = renderHook(() => useSignaling({ onMessage: () => {} }));
  expect(typeof result.current.connect).toBe('function');
  expect(typeof result.current.disconnect).toBe('function');
  expect(typeof result.current.send).toBe('function');
  expect(typeof result.current.isConnected).toBe('boolean');
});
