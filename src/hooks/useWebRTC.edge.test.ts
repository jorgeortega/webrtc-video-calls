import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

// Basic RT constructors
(globalThis as any).RTCSessionDescription = class { constructor(init:any){ Object.assign(this, init); } };
(globalThis as any).RTCIceCandidate = class { constructor(init:any){ Object.assign(this, init); } };

import { useWebRTC } from './useWebRTC';

// Fake PC to capture created data channels
class FakePCEdge {
  static instances: any[] = [];
  lastDataChannel: any = null;
  localDescription: any = null;
  connectionState = 'connected';
  ondatachannel: any = null;
  ontrack: any = null;
  onicecandidate: any = null;
  onconnectionstatechange: any = null;
  _senders: any[] = [];
  constructor() { (FakePCEdge as any).instances.push(this); }
  createDataChannel(name:any) {
    const chan: any = { label: name, onopen: () => {}, onclose: () => {}, onmessage: (_:any) => {}, send: vi.fn(), readyState: 'open' };
    this.lastDataChannel = chan;
    return chan;
  }
  async createOffer() { return { type: 'offer', sdp: 'o' }; }
  async setLocalDescription(d:any) { this.localDescription = d; }
  async setRemoteDescription(d:any) { this.remoteDescription = d; }
  async createAnswer() { return { type: 'answer', sdp: 'a' }; }
  async addIceCandidate(c:any) { this._added = this._added || []; this._added.push(c); }
  addTrack(track:any) { this._senders.push({ track }); }
  getSenders() { return this._senders; }
  removeTrack(sender:any) { this._removed = sender; }
  restartIce() { this._restarted = true; }
  close() {}
}

// Test setup will swap RTCPeerConnection

test('data channel onclose and onmessage parse error log', async () => {
  (globalThis as any).RTCPeerConnection = FakePCEdge as any;
  const sendSignaling = vi.fn();
  const onChat = vi.fn();

  const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling, onChatMessage: onChat }));

  await act(async () => { await result.current.createPeerConnection('dc1', 'dc1', true); });

  // retrieve channel from mock instance
  const pc = (FakePCEdge as any).instances.pop();
  const chan = pc.lastDataChannel;
  // trigger onclose
  act(() => { chan.onclose(); });
  expect(consoleLog).toHaveBeenCalled();

  // invalid JSON triggers console.error
  act(() => { chan.onmessage({ data: 'not-json' }); });
  expect(consoleError).toHaveBeenCalled();

  consoleLog.mockRestore();
  consoleError.mockRestore();
});


test('handleOffer logs when setRemoteDescription throws', async () => {
  // Fake PC that throws on setRemoteDescription
  class FakePCThrow {
    static instances: any[] = [];
    constructor() { (FakePCThrow as any).instances.push(this); }
    async createOffer() { return { type: 'offer', sdp: 'o' }; }
    async setLocalDescription(d:any) { this.local = d; }
    async setRemoteDescription(_d:any) { throw new Error('setRemote fail'); }
    async createAnswer() { return { type: 'answer', sdp: 'a' }; }
    async addIceCandidate(_c:any) {}
    addTrack() {}
    getSenders() { return []; }
    createDataChannel() { return { send: vi.fn(), readyState: 'open' } as any; }
    close() {}
  }
  (globalThis as any).RTCPeerConnection = FakePCThrow as any;

  const sendSignaling = vi.fn();
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling }));

  // call handleOffer which should hit catch when setRemoteDescription throws
  await act(async () => { await result.current.handleOffer('throw1', 't', { type: 'offer', sdp: 's' } as any); });

  expect(consoleError).toHaveBeenCalled();
  consoleError.mockRestore();
});


test('removeScreenShareTrack removes matching senders and renegotiates (error path)', async () => {
  class FakePCB {
    static instances: any[] = [];
    _senders:any[] = [];
    constructor() { (FakePCB as any).instances.push(this); }
    async createOffer() { return { type: 'offer', sdp: 'o' }; }
    async setLocalDescription(d:any) { this.local = d; }
    getSenders() { return this._senders; }
    removeTrack(sender:any) { this._removed = sender; }
    async addIceCandidate() {}
    addTrack() {}
    createDataChannel() { return { send: vi.fn(), readyState: 'open' } as any; }
    close() {}
  }
  (globalThis as any).RTCPeerConnection = FakePCB as any;

  const screenTrack = { id: 'st1' } as any;
  const screen = { getTracks: () => [screenTrack] } as any;

  // construct hook with initial screenStream so screenStreamRef.current set
  const sendSignaling = vi.fn();
  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: screen as any, peerId: 'me', username: 'me', sendSignaling }));

  // create one peer
  await act(async () => { await result.current.createPeerConnection('r1', 'r1', true); });
  const pc = (FakePCB as any).instances.pop();
  // make sender match the screen track so removeTrack path finds it
  pc._senders = [{ track: screen.getTracks()[0] }];

  // ensure createOffer works and sendSignaling called
  await act(async () => { result.current.removeScreenShareTrack(); });
  expect(sendSignaling).toHaveBeenCalled();

  // Now simulate createOffer throwing to hit error branch
  pc.createOffer = async () => { throw new Error('boom'); };
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  await act(async () => { result.current.removeScreenShareTrack(); });
  expect(consoleError).toHaveBeenCalled();
  consoleError.mockRestore();
});


test('createPeerConnection adds new remote peer and ontrack adds stream entry', async () => {
  (globalThis as any).RTCPeerConnection = FakePCEdge as any;
  const sendSignaling = vi.fn();
  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling }));

  // initially no peers
  expect(result.current.remotePeers).toHaveLength(0);

  await act(async () => { await result.current.createPeerConnection('new1', 'Alice', false); });
  expect(result.current.remotePeers.find(p => p.peerId === 'new1')).toBeDefined();

  // remove the peer from state so ontrack will add it again (covers the 'add new peer' branch)
  const pc = (FakePCEdge as any).instances.pop();
  await act(async () => { result.current.removePeer('new1'); });
  const fakeStream = { id: 'stream1' } as any;
  act(() => { pc.ontrack({ streams: [fakeStream] }); });
  const p = result.current.remotePeers.find((x:any) => x.peerId === 'new1');
  expect(p.stream).toBe(fakeStream);
});


test('createPeerConnection returns early when peer already exists', async () => {
  (globalThis as any).RTCPeerConnection = FakePCEdge as any;
  const sendSignaling = vi.fn();
  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling }));

  await act(async () => { await result.current.createPeerConnection('dup', 'X', false); });
  const before = result.current.remotePeers.length;
  await act(async () => { await result.current.createPeerConnection('dup', 'X', false); });
  const after = result.current.remotePeers.length;
  expect(after).toBe(before);
});

test('ontrack updates screenStream when different stream id', async () => {
  (globalThis as any).RTCPeerConnection = FakePCEdge as any;
  const sendSignaling = vi.fn();
  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: null, peerId: 'me', username: 'me', sendSignaling }));

  await act(async () => { await result.current.createPeerConnection('p2', 'Bob', false); });
  const pc = (FakePCEdge as any).instances.pop();
  const s1 = { id: 's1' } as any;
  act(() => { pc.ontrack({ streams: [s1] }); });
  let p = result.current.remotePeers.find((x:any) => x.peerId === 'p2');
  expect(p.stream).toBe(s1);

  const s2 = { id: 's2' } as any;
  act(() => { pc.ontrack({ streams: [s2] }); });
  p = result.current.remotePeers.find((x:any) => x.peerId === 'p2');
  expect(p.screenStream).toBe(s2);
});


test('handleOffer renegotiation createOffer throws logs error', async () => {
  vi.useFakeTimers();
  class FakePCReneg {
    static instances: any[] = [];
    constructor() { (FakePCReneg as any).instances.push(this); }
    async createOffer() { throw new Error('reneg fail'); }
    async setLocalDescription(d:any) { this.local = d; }
    async setRemoteDescription(d:any) { this.remote = d; }
    async createAnswer() { return { type: 'answer', sdp: 'a' }; }
    async addIceCandidate() {}
    addTrack() {}
    getSenders() { return []; }
    createDataChannel() { return { send: vi.fn(), readyState: 'open' } as any; }
    close() {}
  }
  (globalThis as any).RTCPeerConnection = FakePCReneg as any;

  const screen = { getTracks: () => [{ id: 's1' }] } as any;
  const sendSignaling = vi.fn();
  const { result } = renderHook(() => useWebRTC({ localStream: null, screenStream: screen as any, peerId: 'me', username: 'me', sendSignaling }));

  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  // call handleOffer which will schedule renegotiation that throws
  await act(async () => { await result.current.handleOffer('ren1', 'Bob', { type: 'offer', sdp: 's' } as any); });

  // advance timers to trigger renegotiation
  await act(async () => { vi.advanceTimersByTime(500); await Promise.resolve(); });

  expect(consoleError).toHaveBeenCalled();

  consoleError.mockRestore();
  vi.useRealTimers();
});
