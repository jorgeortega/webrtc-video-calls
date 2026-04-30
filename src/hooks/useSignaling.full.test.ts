import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

class FakeWS2 {
  static OPEN = 1;
  onopen = () => {};
  onclose = () => {};
  onmessage = (_: any) => {};
  onerror = (_: any) => {};
  readyState = 0;
  send = vi.fn();
  close = vi.fn(() => { this.readyState = 3; this.onclose(); });
  constructor() { 
    (FakeWS2 as any).instances = (FakeWS2 as any).instances || [];
    (FakeWS2 as any).instances.push(this);
  }
}

vi.stubGlobal('WebSocket', FakeWS2 as any);

import { useSignaling } from './useSignaling';

test('connect and message handling and disconnect', () => {
  const onMessage = vi.fn();
  const onConnected = vi.fn();
  const onDisconnected = vi.fn();

  const { result } = renderHook(() => useSignaling({ onMessage, onConnected, onDisconnected }));

  act(() => result.current.connect());
  const ws = (WebSocket as any).instances[0];

  // simulate open
  act(() => { ws.readyState = (WebSocket as any).OPEN; ws.onopen(); });
  expect(onConnected).toHaveBeenCalled();

  // simulate message
  act(() => ws.onmessage({ data: JSON.stringify({ type: 'hello' }) }));
  expect(onMessage).toHaveBeenCalledWith({ type: 'hello' });

  // send should use ws.send when connected
  act(() => result.current.send({ type: 'out' } as any));
  expect(ws.send).toHaveBeenCalled();

  // disconnect
  act(() => result.current.disconnect());
  expect(onDisconnected).toHaveBeenCalled();
});

test('invalid JSON in onmessage logs error and send warns when disconnected', () => {
  const onMessage = vi.fn();
  const onConnected = vi.fn();
  const onDisconnected = vi.fn();

  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  const { result } = renderHook(() => useSignaling({ onMessage, onConnected, onDisconnected }));

  act(() => result.current.connect());
  const ws = (WebSocket as any).instances.pop();
  act(() => ws.onmessage({ data: 'not-json' }));
  expect(consoleError).toHaveBeenCalled();

  // ensure send warns when not open
  act(() => result.current.send({ type: 'x' } as any));
  expect(consoleWarn).toHaveBeenCalled();

  consoleError.mockRestore();
  consoleWarn.mockRestore();
});