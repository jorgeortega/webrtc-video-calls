import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

// Fake RTCPeerConnection that triggers ontrack and connection failures after handlers are attached
class FakePC {
  connectionState: string = 'new';
  ondatachannel: any = null;
  ontrack: any = null;
  onicecandidate: any = null;
  onconnectionstatechange: any = null;
  localDescription: any = null;
  _senders: any[] = [];

  constructor() {
    // simulate a remote track arriving shortly after creation
    setTimeout(() => {
      if (this.ontrack) {
        const fakeRemoteStream = { id: 'r1', getTracks: () => [{ stop: () => {} }], getVideoTracks: () => [{ stop: () => {} }] } as any;
        this.ontrack({ streams: [fakeRemoteStream] });
      }
    }, 0);

    // simulate connection failure to trigger restartIce after handler is attached
    setTimeout(() => {
      this.connectionState = 'failed';
      if (this.onconnectionstatechange) this.onconnectionstatechange();
    }, 10);
  }

  createDataChannel(label: string) {
    return { label, readyState: 'open', send: vi.fn(), onopen: () => {} };
  }
  addTrack(track: any) { this._senders.push({ track }); }
  getSenders() { return this._senders; }
  close() { this.connectionState = 'closed'; if (this.onconnectionstatechange) this.onconnectionstatechange(); }
  async createOffer() { return { type: 'offer', sdp: 'o' }; }
  async setLocalDescription(desc: any) { this.localDescription = desc; }
  async setRemoteDescription(desc: any) { }
  async createAnswer() { return { type: 'answer', sdp: 'a' }; }
  async addIceCandidate(_c: any) {}
  restartIce() { /* noop */ }
}

;(globalThis as any).RTCPeerConnection = FakePC as any;

import { useWebRTC } from './useWebRTC';

test('useWebRTC handles ontrack and connection failures', async () => {
  const sendSignaling = vi.fn();
  const onChat = vi.fn();

  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling, onChatMessage: onChat }));

  // create a connection (initiator) should call sendSignaling for offer
  await act(async () => { await result.current.createPeerConnection('p1', 'P', true); });
  expect(sendSignaling).toHaveBeenCalled();

  // allow scheduled ontrack and connectionstatechange to run
  await new Promise((r) => setTimeout(r, 20));

  // remotePeers should include the peer due to ontrack
  expect(result.current.remotePeers.length).toBeGreaterThanOrEqual(1);
});
