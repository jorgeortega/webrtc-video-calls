import { render, act } from '@testing-library/react';
import { vi } from 'vitest';

let capturedOnMessage: ((m: any) => void) | null = null;

vi.mock('../hooks/useSignaling', () => ({
  useSignaling: (opts: any) => {
    capturedOnMessage = opts.onMessage;
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
    };
  },
}));

const createPeerConnection = vi.fn();
const removePeer = vi.fn();
const handleOffer = vi.fn();
const handleAnswer = vi.fn();
const handleIceCandidate = vi.fn();
const updatePeerUsername = vi.fn();
const clearPeerScreenStream = vi.fn();

vi.mock('../hooks/useWebRTC', () => ({
  useWebRTC: () => ({
    remotePeers: [],
    closeAllConnections: vi.fn(),
    sendChatMessage: vi.fn(),
    addScreenShareTrack: vi.fn(),
    removeScreenShareTrack: vi.fn(),
    createPeerConnection,
    removePeer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    updatePeerUsername,
    clearPeerScreenStream,
    remotePeersLength: 0,
  }),
}));

vi.mock('../hooks/useScreenShare', () => ({ useScreenShare: () => ({ screenStream: null, isScreenSharing: false, startScreenShare: vi.fn(), stopScreenShare: vi.fn() }) }));
vi.mock('../hooks/useChat', () => ({ useChat: () => ({ messages: [], unreadCount: 0, addMessage: vi.fn(), markAsRead: vi.fn() }) }));

import { CallScreen } from './CallScreen';

const fakeStream = { getTracks: () => [{ stop: vi.fn() }], getVideoTracks: () => [{ stop: vi.fn() }], id: 's1' } as any;

test('handle various signaling message types', async () => {
  await act(async () => {
    render(
      <CallScreen
        meetingId="m"
        username="u"
        peerId="p"
        localStream={fakeStream}
        isAudioEnabled={true}
        isVideoEnabled={true}
        onToggleAudio={() => {}}
        onToggleVideo={() => {}}
        onLeave={() => {}}
      />
    );
  });

  // Simulate room-peers
  act(() => capturedOnMessage && capturedOnMessage({ type: 'room-peers', peers: [{ peerId: 'a', username: 'A' }] }));
  expect(createPeerConnection).toHaveBeenCalled();

  // peer-joined
  act(() => capturedOnMessage && capturedOnMessage({ type: 'peer-joined', peerId: 'b', username: 'B' }));

  // peer-left
  act(() => capturedOnMessage && capturedOnMessage({ type: 'peer-left', peerId: 'a' }));
  expect(removePeer).toHaveBeenCalled();

  // offer
  act(() => capturedOnMessage && capturedOnMessage({ type: 'offer', from: 'x', username: 'X', sdp: {} }));
  expect(handleOffer).toHaveBeenCalled();

  // answer
  act(() => capturedOnMessage && capturedOnMessage({ type: 'answer', from: 'x', sdp: {} }));
  expect(handleAnswer).toHaveBeenCalled();

  // ice-candidate
  act(() => capturedOnMessage && capturedOnMessage({ type: 'ice-candidate', from: 'x', candidate: {} }));
  expect(handleIceCandidate).toHaveBeenCalled();

  // username-update
  act(() => capturedOnMessage && capturedOnMessage({ type: 'username-update', peerId: 'x', username: 'New' }));
  expect(updatePeerUsername).toHaveBeenCalled();

  // screen-share-stopped
  act(() => capturedOnMessage && capturedOnMessage({ type: 'screen-share-stopped', peerId: 'x' }));
  expect(clearPeerScreenStream).toHaveBeenCalled();
});
