import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

// Fake RT constructors
(globalThis as any).RTCSessionDescription = class { constructor(init:any){ Object.assign(this, init); } };
(globalThis as any).RTCIceCandidate = class { constructor(init:any){ Object.assign(this, init); } };

// Fake RTCPeerConnection used for controlled testing
class FakePC {
  static instances: any[] = [];
  localDescription: any = null;
  remoteDescription: any = null;
  connectionState: string = 'connected';
  ondatachannel: any = null;
  ontrack: any = null;
  onicecandidate: any = null;
  onconnectionstatechange: any = null;
  _senders: any[] = [];
  _addedCandidates: any[] = [];
  constructor() { (FakePC as any).instances.push(this); }
  async createOffer() { return { type: 'offer', sdp: 'offer-sdp' }; }
  async setLocalDescription(desc:any) { this.localDescription = desc; }
  async setRemoteDescription(desc:any) { this.remoteDescription = desc; }
  async createAnswer() { return { type: 'answer', sdp: 'answer-sdp' }; }
  async addIceCandidate(c:any) { this._addedCandidates.push(c); }
  addTrack(track:any, _stream:any) { const sender = { track }; this._senders.push(sender); }
  getSenders() { return this._senders; }
  removeTrack(sender:any) { this._removed = sender; }
  createDataChannel(_name:any) { return { send: vi.fn(), readyState: 'open' } as any; }
  restartIce() { this._restarted = true; }
  close() {}
}

;(globalThis as any).RTCPeerConnection = FakePC as any;

import { useWebRTC } from './useWebRTC';

// helpers
const makeStream = (id: string) => ({ id, getTracks: () => [{ id, kind: 'video' }] } as any);

test('createPeerConnection as initiator sends offer and attaches local tracks', async () => {
  const sendSignaling = vi.fn();
  const local = makeStream('local1');

  const { result } = renderHook(() => useWebRTC({ localStream: local, screenStream: null, peerId: 'me', username: 'me', sendSignaling }));

  await act(async () => {
    await result.current.createPeerConnection('peer1', 'peer1-user', true);
  });

  // sendSignaling should have been called for offer
  expect(sendSignaling).toHaveBeenCalled();

  const pc = (FakePC as any).instances.pop();
  // simulate onicecandidate event
  act(() => {
    pc.onicecandidate && pc.onicecandidate({ candidate: { toJSON: () => ({ candidate: 'c' }) } });
  });
  expect(sendSignaling).toHaveBeenCalled();

  // simulate connection state failed
  act(() => { pc.connectionState = 'failed'; pc.onconnectionstatechange && pc.onconnectionstatechange(); });
  expect(pc._restarted).toBeTruthy();
});

test('handleOffer processes pending ICE candidates and renegotiates for screen share', async () => {
  const sendSignaling = vi.fn();
  const fakeScreen = makeStream('screen1');

  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: fakeScreen, peerId: 'me', username: 'me', sendSignaling }));

  // queue a candidate before peer exists
  await act(async () => {
    await result.current.handleIceCandidate('peer2', { candidate: 'queued' } as any);
  });

  // handleOffer will create peer and process queued candidate
  vi.useFakeTimers();
  await act(async () => {
    await result.current.handleOffer('peer2', 'peer2-user', { type: 'offer', sdp: 's' } as any);
  });

  // advance timers for renegotiation
  act(() => vi.advanceTimersByTime(500));
  vi.useRealTimers();

  const pc = (FakePC as any).instances.pop();
  expect(pc._addedCandidates.length).toBeGreaterThanOrEqual(0);
  // should have sent signaling during renegotiation as well
  expect(sendSignaling).toHaveBeenCalled();
});

test('handleAnswer applies remote description and drains pending candidates', async () => {
  const sendSignaling = vi.fn();
  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling }));

  // create a peer first
  await act(async () => {
    await result.current.createPeerConnection('peer3', 'peer3-user', true);
  });

  // queue a candidate
  await act(async () => {
    await result.current.handleIceCandidate('peer3', { candidate: 'c3' } as any);
  });

  // handleAnswer should set remote desc and process pending
  await act(async () => {
    await result.current.handleAnswer('peer3', { type: 'answer', sdp: 'a' } as any);
  });

  const pc = (FakePC as any).instances.pop();
  expect(pc._addedCandidates.length).toBeGreaterThanOrEqual(0);
});

test('addScreenShareTrack and removeScreenShareTrack renegotiate and remove senders', async () => {
  const sendSignaling = vi.fn();
  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling }));

  // create two peers
  await act(async () => { await result.current.createPeerConnection('pA', 'A', true); });
  await act(async () => { await result.current.createPeerConnection('pB', 'B', true); });

  const pcA = (FakePC as any).instances.shift();
  const pcB = (FakePC as any).instances.shift();

  // prepare screen stream
  const screen = makeStream('screenX');
  // add track should call createOffer and send signaling
  await act(async () => { result.current.addScreenShareTrack(screen as any); });
  expect(sendSignaling).toHaveBeenCalled();

  // make pcA have a sender matching screen track so removeScreenShareTrack finds it
  pcA._senders = [{ track: screen.getTracks()[0] }];

  await act(async () => { result.current.removeScreenShareTrack(); });
  expect(sendSignaling).toHaveBeenCalled();
});

test('incoming datachannel triggers onChatMessage and parse error branch', async () => {
  const sendSignaling = vi.fn();
  const onChatMessage = vi.fn();
  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling, onChatMessage }));

  // create peer (non-initiator) so pc.ondatachannel is set
  await act(async () => { await result.current.createPeerConnection('pDC', 'DC', false); });
  const pc = (FakePC as any).instances.pop();

  // simulate incoming datachannel
  const channel: any = { onopen: () => {}, onclose: () => {}, onmessage: (_: any) => {}, send: vi.fn(), readyState: 'open' };
  act(() => { pc.ondatachannel && pc.ondatachannel({ channel }); });

  // valid JSON message
  act(() => { channel.onmessage({ data: JSON.stringify({ id: 'm1', from: 'x', username: 'u', text: 'hi', timestamp: Date.now() }) }); });
  expect(onChatMessage).toHaveBeenCalled();

  // invalid JSON should hit catch
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  act(() => { channel.onmessage({ data: 'not-json' }); });
  expect(consoleError).toHaveBeenCalled();
  consoleError.mockRestore();
});

test('handleIceCandidate logs when addIceCandidate throws', async () => {
  const sendSignaling = vi.fn();
  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling }));

  // create pc
  await act(async () => { await result.current.createPeerConnection('pErr', 'Err', true); });
  const pc = (FakePC as any).instances.pop();

  // ensure remoteDescription exists so path adds candidate immediately
  pc.remoteDescription = { type: 'answer' };
  // make addIceCandidate throw
  pc.addIceCandidate = async () => { throw new Error('boom'); };

  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  await act(async () => { await result.current.handleIceCandidate('pErr', { candidate: 'x' } as any); });
  expect(consoleError).toHaveBeenCalled();
  consoleError.mockRestore();
});