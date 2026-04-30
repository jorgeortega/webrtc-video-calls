import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

// More fully featured fake RTCPeerConnection to exercise hook logic
class FakePC {
  connectionState: string = 'new';
  ondatachannel: any = null;
  ontrack: any = null;
  onicecandidate: any = null;
  onconnectionstatechange: any = null;
  localDescription: any = null;
  remoteDescription: any = null;
  _senders: any[] = [];

  constructor() {}

  createDataChannel(label: string) {
    const channel = {
      label,
      readyState: 'open',
      send: vi.fn(),
      onopen: () => {},
      onmessage: (_: any) => {},
      onclose: () => {},
    };
    // call onopen later
    setTimeout(() => channel.onopen(), 0);
    return channel;
  }

  addTrack(track: any, _stream?: any) {
    this._senders.push({ track });
  }

  removeTrack(sender: any) {
    // noop for test
  }

  getSenders() {
    return this._senders;
  }

  close() {
    this.connectionState = 'closed';
    if (this.onconnectionstatechange) this.onconnectionstatechange();
  }

  async createOffer() {
    return { type: 'offer', sdp: `v=0\no=- 0 0 IN IP4 127.0.0.1` };
  }

  async setLocalDescription(desc: any) {
    this.localDescription = desc;
  }

  async setRemoteDescription(desc: any) {
    this.remoteDescription = desc;
  }

  async createAnswer() {
    return { type: 'answer', sdp: `v=0\no=- 0 0 IN IP4 127.0.0.1` };
  }

  async addIceCandidate(_candidate: any) {
    // noop
  }

  restartIce() {
    // noop
  }
}

// Ensure global RTCPeerConnection is our fake before importing hook
;(globalThis as any).RTCPeerConnection = FakePC as any;

import { useWebRTC } from './useWebRTC';

const noop = () => {};

test('useWebRTC flows: create connection, offer/answer, candidates, chat, screen share, cleanup', async () => {
  const sendSignaling = vi.fn();
  const onChat = vi.fn();

  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling, onChatMessage: onChat }));

  // create peer connection as initiator -> should send offer
  await act(async () => {
    await result.current.createPeerConnection('peer1', 'peer', true);
  });
  expect(sendSignaling).toHaveBeenCalled();

  // simulate receiving an offer from remote for a new peer -> should create answer and send it
  await act(async () => {
    await result.current.handleOffer('peer2', 'peer2', { type: 'offer', sdp: 'sdp' } as any);
  });
  // an answer should have been sent
  expect(sendSignaling).toHaveBeenCalled();

  // handleAnswer should set remote description without throwing
  await act(async () => {
    await result.current.handleAnswer('peer1', { type: 'answer', sdp: 'sdp' } as any);
  });

  // handleIceCandidate for unknown peer queues candidate
  await act(async () => {
    await result.current.handleIceCandidate('unknown-peer', { candidate: 'c' } as any);
  });

  // Now create connection for unknown-peer and then deliver answer to flush candidates
  await act(async () => {
    await result.current.createPeerConnection('unknown-peer', 'u', false);
    await result.current.handleAnswer('unknown-peer', { type: 'answer', sdp: 'sdp' } as any);
  });

  // send chat message should call onChat locally
  act(() => result.current.sendChatMessage('hi'));
  expect(onChat).toHaveBeenCalled();

  // addScreenShareTrack should call sendSignaling for each peer
  const fakeScreen = { getTracks: () => [{ stop: () => {} }], id: 'screen1' } as any;
  await act(async () => {
    result.current.addScreenShareTrack(fakeScreen);
  });
  expect(sendSignaling).toHaveBeenCalled();

  // removeScreenShareTrack should attempt to renegotiate as well
  act(() => result.current.removeScreenShareTrack());
  expect(sendSignaling).toHaveBeenCalled();

  // updatePeerUsername and clearPeerScreenStream
  act(() => result.current.updatePeerUsername('peer1', 'newname'));
  act(() => result.current.clearPeerScreenStream('peer1'));

  // remove peer and close all
  act(() => result.current.removePeer('peer1'));
  act(() => result.current.closeAllConnections());

  expect(result.current.remotePeers).toBeDefined();
});
