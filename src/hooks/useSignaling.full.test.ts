import { renderHook, act } from '@testing-library/react';
import { vi, test, expect, beforeEach } from 'vitest';

class FakeWS2 {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: FakeWS2[] = [];
  onopen = () => {};
  onclose = () => {};
  onmessage = (_: any) => {};
  onerror = (_: any) => {};
  readyState = FakeWS2.CONNECTING;
  send = vi.fn();
  close = vi.fn(() => { this.readyState = FakeWS2.CLOSED; this.onclose(); });
  constructor() { 
    FakeWS2.instances.push(this);
  }
}

vi.stubGlobal('WebSocket', FakeWS2 as any);

import { useSignaling } from './useSignaling';

beforeEach(() => {
  FakeWS2.instances = [];
});

test('connect and message handling and disconnect', () => {
  const onMessage = vi.fn();
  const onConnected = vi.fn();
  const onDisconnected = vi.fn();

  const { result } = renderHook(() => useSignaling({ onMessage, onConnected, onDisconnected }));

  act(() => result.current.connect());
  const ws = FakeWS2.instances[0];

  // simulate open
  act(() => { ws.readyState = FakeWS2.OPEN; ws.onopen(); });
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
  const ws = FakeWS2.instances.pop()!;
  act(() => ws.onmessage({ data: 'not-json' }));
  expect(consoleError).toHaveBeenCalled();

  // ensure send warns when not open
  act(() => result.current.send({ type: 'x' } as any));
  expect(consoleWarn).toHaveBeenCalled();

  consoleError.mockRestore();
  consoleWarn.mockRestore();
});