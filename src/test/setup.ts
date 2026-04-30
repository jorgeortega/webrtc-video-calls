import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock PointerEvent if not available (needed for Radix UI in jsdom)
if (!global.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
    }
  }
  // @ts-ignore
  global.PointerEvent = PointerEvent;
}

// Mock HTMLElement prototype methods used by Radix
HTMLElement.prototype.scrollIntoView = vi.fn();
HTMLElement.prototype.releasePointerCapture = vi.fn();
HTMLElement.prototype.hasPointerCapture = vi.fn();

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock browser APIs that aren't available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock WebRTC APIs
class MockRTCPeerConnection {
  createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'sdp' });
  setLocalDescription = vi.fn().mockResolvedValue(undefined);
  setRemoteDescription = vi.fn().mockResolvedValue(undefined);
  addIceCandidate = vi.fn().mockResolvedValue(undefined);
  createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'sdp' });
  addTrack = vi.fn();
  removeTrack = vi.fn();
  getSenders = vi.fn().mockReturnValue([]);
  createDataChannel = vi.fn().mockReturnValue({
    send: vi.fn(),
    close: vi.fn(),
    onopen: null,
    onclose: null,
    onmessage: null,
    readyState: 'open'
  });
  close = vi.fn();
  restartIce = vi.fn();
  onicecandidate = null;
  ontrack = null;
  ondatachannel = null;
  onconnectionstatechange = null;
  connectionState = 'new';
  localDescription = { type: 'offer', sdp: 'sdp' };
  remoteDescription = { type: 'offer', sdp: 'sdp' };
}

Object.defineProperty(window, 'RTCPeerConnection', {
  writable: true,
  value: MockRTCPeerConnection
});

Object.defineProperty(window, 'RTCSessionDescription', {
  writable: true,
  value: vi.fn().mockImplementation((init) => init)
});

Object.defineProperty(window, 'RTCIceCandidate', {
  writable: true,
  value: vi.fn().mockImplementation((init) => init)
});

// Mock MediaDevices API
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    enumerateDevices: vi.fn().mockResolvedValue([]),
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn().mockReturnValue([]),
      getVideoTracks: vi.fn().mockReturnValue([]),
      getAudioTracks: vi.fn().mockReturnValue([]),
    }),
    getDisplayMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn().mockReturnValue([]),
      getVideoTracks: vi.fn().mockReturnValue([{ onended: null }]),
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
