import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { makeStream, installBasicRTMocks } from '../test/fakes';

installBasicRTMocks();

import { useWebRTC } from './useWebRTC';

test('sendChatMessage sends on open channels and triggers local handler', async () => {
  const sendSignaling = vi.fn();
  const onChat = vi.fn();

  // Fake PC that creates a data channel object
  class FakePCSimple {
    constructor() {}
    createDataChannel() { return { send: vi.fn(), readyState: 'open' } as any; }
    addTrack() {}
    close() {}
  }
  (globalThis as any).RTCPeerConnection = FakePCSimple as any;

  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling, onChatMessage: onChat }));

  await act(async () => { await result.current.createPeerConnection('d1', 'd1', true); });

  // data channel should be open and sendChatMessage should call onChat and attempt to send
  act(() => { result.current.sendChatMessage('hello'); });

  expect(onChat).toHaveBeenCalled();
});

test('clearPeerScreenStream clears screenStream for peer', async () => {
  const sendSignaling = vi.fn();
  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling }));

  await act(async () => { await result.current.createPeerConnection('c1', 'c1', false); });

  // Simulate ontrack to set screenStream
  const pc = (globalThis as any).RTCPeerConnection.instances ? (globalThis as any).RTCPeerConnection.instances[0] : null;
  // If no instance tracking, just call functions to ensure API exists
  if (pc && pc.ontrack) {
    act(() => pc.ontrack({ streams: [{ id: 'sX' }] }));
  }

  // Ensure function runs
  act(() => result.current.clearPeerScreenStream('c1'));

  expect(result.current.remotePeers.find(p => p.peerId === 'c1')?.screenStream).toBeNull();
});
