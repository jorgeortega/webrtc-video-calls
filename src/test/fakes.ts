export const makeStream = (id: string) => ({
  id,
  getTracks: () => [{ id, kind: 'video', stop: () => {} }],
  getVideoTracks: () => [{ id, kind: 'video', stop: () => {} }],
  getAudioTracks: () => [] as any[],
} as any);

export function installBasicRTMocks() {
  (globalThis as any).RTCSessionDescription = class { constructor(init:any){ Object.assign(this, init); } };
  (globalThis as any).RTCIceCandidate = class { constructor(init:any){ Object.assign(this, init); } };
}

export function installFakeWS() {
  class FakeWS {
    static instances: any[] = [];
    onopen = () => {};
    onclose = () => {};
    onmessage = (_: any) => {};
    onerror = (_: any) => {};
    readyState = 0;
    send = vi.fn();
    close = vi.fn(() => { this.readyState = 3; this.onclose(); });
    constructor() { (FakeWS as any).instances = (FakeWS as any).instances || []; (FakeWS as any).instances.push(this); }
  }
  // @ts-ignore
  (globalThis as any).WebSocket = FakeWS;
}
