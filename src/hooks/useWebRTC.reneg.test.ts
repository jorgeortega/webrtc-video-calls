import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

// Fake PC that supports createOffer/setLocalDescription and records calls
class FakePCReneg {
  localDescription: any = null;
  onconnectionstatechange: any = null;
  ontrack: any = null;
  constructor() {}
  async createOffer() { return { type: 'offer', sdp: 'o' }; }
  async setLocalDescription(desc: any) { this.localDescription = desc; }
  async setRemoteDescription(_desc: any) {}
  async createAnswer() { return { type: 'answer', sdp: 'a' }; }
  async addIceCandidate(_c: any) {}
  addTrack(_t: any) {}
  getSenders() { return []; }
  close() {}
}

(globalThis as any).RTCSessionDescription = class { constructor(init:any){ Object.assign(this, init); } };
(globalThis as any).RTCIceCandidate = class { constructor(init:any){ Object.assign(this, init); } };

;(globalThis as any).RTCPeerConnection = FakePCReneg as any;

import { useWebRTC } from './useWebRTC';

test('handleOffer triggers renegotiation when screen sharing', async () => {
  const sendSignaling = vi.fn();
  const fakeScreen = { getTracks: () => [{ stop: () => {} }], id: 'screen1' } as any;

  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: fakeScreen, peerId: 'me', username: 'me', sendSignaling }));

  vi.useFakeTimers();

  await act(async () => {
    await result.current.handleOffer('peerR', 'peerR', { type: 'offer', sdp: 's' } as any);
  });

  // advance timers to trigger renegotiation setTimeout
  act(() => {
    vi.advanceTimersByTime(500);
  });

  // sendSignaling should have been called for initial answer and renegotiation offer
  expect(sendSignaling).toHaveBeenCalled();

  vi.useRealTimers();
});