import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

(globalThis as any).RTCSessionDescription = class { constructor(init:any){ Object.assign(this, init); } };
(globalThis as any).RTCIceCandidate = class { constructor(init:any){ Object.assign(this, init); } };

class FakePC2 {
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
  constructor() { (FakePC2 as any).instances.push(this); }
  async createOffer() { return { type: 'offer', sdp: 'offer' }; }
  async setLocalDescription(d:any) { this.localDescription = d; }
  async setRemoteDescription(d:any) { this.remoteDescription = d; }
  async createAnswer() { return { type: 'answer', sdp: 'ans' }; }
  async addIceCandidate(c:any) { this._addedCandidates.push(c); }
  addTrack(track:any) { this._senders.push({ track }); }
  getSenders() { return this._senders; }
  removeTrack(sender:any) { this._removed = sender; }
  createDataChannel() { return { send: vi.fn(), readyState: 'open' }; }
  restartIce() { this._restarted = true; }
  close() {}
}

;(globalThis as any).RTCPeerConnection = FakePC2 as any;

import { useWebRTC } from './useWebRTC';

const makeStream = (id: string) => ({ id, getTracks: () => [{ id, kind: 'video' }], getVideoTracks: () => [{ id }], getAudioTracks: () => [] } as any);

test('createPeerConnection idempotent and ontrack sets screenStream when new id', async () => {
  (FakePC2 as any).instances = [];
  const sendSignaling = vi.fn();
  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling }));

  await act(async () => { await result.current.createPeerConnection('dup2', 'dup2', true); });
  const before = (FakePC2 as any).instances.length;
  await act(async () => { await result.current.createPeerConnection('dup2', 'dup2', true); });
  const after = (FakePC2 as any).instances.length;
  expect(after).toBe(before);

  const pc = (FakePC2 as any).instances.pop();
  act(() => pc.ontrack && pc.ontrack({ streams: [{ id: 'one' }] }));
  expect(result.current.remotePeers.find(p => p.peerId === 'dup2')?.stream).toBeDefined();
  act(() => pc.ontrack && pc.ontrack({ streams: [{ id: 'two' }] }));
  expect(result.current.remotePeers.find(p => p.peerId === 'dup2')?.screenStream).toBeDefined();
});

test('handleOffer updates Unknown username', async () => {
  (FakePC2 as any).instances = [];
  const sendSignaling = vi.fn();
  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling }));

  await act(async () => { await result.current.createPeerConnection('uY', 'Unknown', false); });
  await act(async () => { await result.current.handleOffer('uY', 'Realer', { type: 'offer', sdp: 's' } as any); });
  expect(result.current.remotePeers.find(p => p.peerId === 'uY')?.username).toBe('Realer');
});

test('addScreenShareTrack and removeScreenShareTrack error branches', async () => {
  (FakePC2 as any).instances = [];
  const sendSignaling = vi.fn();
  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling }));

  await act(async () => { await result.current.createPeerConnection('err1', 'e1', true); });
  const pc = (FakePC2 as any).instances.pop();
  pc.createOffer = async () => { throw new Error('boom'); };

  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const screen = makeStream('s1');
  await act(async () => { result.current.addScreenShareTrack(screen as any); });
  expect(consoleError).toHaveBeenCalled();

  // prepare for removeScreenShareTrack
  (FakePC2 as any).instances = [];
  const screen2 = { getTracks: () => [{ id: 'tX' }] } as any;
  const { result: res2 } = renderHook(() => useWebRTC({ localStream: null, screenStream: screen2 as any, peerId: 'me', username: 'me', sendSignaling }));
  await act(async () => { await res2.current.createPeerConnection('err2', 'e2', true); });
  const pc2 = (FakePC2 as any).instances.pop();
  pc2._senders = [{ track: screen2.getTracks()[0] }];
  pc2.createOffer = async () => { throw new Error('boom2'); };

  await act(async () => { res2.current.removeScreenShareTrack(); });
  expect(consoleError).toHaveBeenCalled();
  consoleError.mockRestore();
});