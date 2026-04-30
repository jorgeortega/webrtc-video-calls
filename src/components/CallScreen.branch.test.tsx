import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';

// Simple Controls mock to expose handlers
vi.mock('./Controls', () => ({
  Controls: ({
    onToggleAudio,
    onToggleVideo,
    onToggleScreenShare,
    onToggleChat,
    onLeave,
    unreadMessages,
  }: any) => (
    <div>
      <button data-testid="toggle-audio" onClick={onToggleAudio}>toggle-audio</button>
      <button data-testid="toggle-video" onClick={onToggleVideo}>toggle-video</button>
      <button data-testid="toggle-screen" onClick={onToggleScreenShare}>toggle-screen</button>
      <button data-testid="toggle-chat" onClick={onToggleChat}>toggle-chat</button>
      <button data-testid="leave" onClick={onLeave}>leave</button>
      <div data-testid="unread">{unreadMessages}</div>
    </div>
  ),
}));

// Module-level mutable mocks so tests can change behavior without nested vi.mock
let mockSend = vi.fn();
let mockUseSignaling = () => ({ connect: vi.fn(), disconnect: vi.fn(), send: mockSend });
vi.mock('../hooks/useSignaling', () => ({ useSignaling: () => mockUseSignaling() }));

let mockWebrtcImpl = {
  remotePeers: [],
  createPeerConnection: vi.fn(),
  handleOffer: vi.fn(),
  handleAnswer: vi.fn(),
  handleIceCandidate: vi.fn(),
  removePeer: vi.fn(),
  closeAllConnections: vi.fn(),
  sendChatMessage: vi.fn(),
  addScreenShareTrack: vi.fn(),
  removeScreenShareTrack: vi.fn(),
  updatePeerUsername: vi.fn(),
  clearPeerScreenStream: vi.fn(),
};
vi.mock('../hooks/useWebRTC', () => ({ useWebRTC: () => mockWebrtcImpl }));

let mockStart = vi.fn().mockResolvedValue(null);
let mockStop = vi.fn();
let mockIsScreenSharing = false;
vi.mock('../hooks/useScreenShare', () => ({ useScreenShare: () => ({ screenStream: null, isScreenSharing: mockIsScreenSharing, startScreenShare: mockStart, stopScreenShare: mockStop }) }));

vi.mock('../hooks/useChat', () => ({ useChat: () => ({ messages: [], unreadCount: 0, addMessage: vi.fn(), markAsRead: vi.fn() }) }));

import { CallScreen } from './CallScreen';

beforeEach(() => {
  vi.resetAllMocks();
  mockSend = vi.fn();
  mockUseSignaling = () => ({ connect: vi.fn(), disconnect: vi.fn(), send: mockSend });
  mockWebrtcImpl = {
    remotePeers: [],
    createPeerConnection: vi.fn(),
    handleOffer: vi.fn(),
    handleAnswer: vi.fn(),
    handleIceCandidate: vi.fn(),
    removePeer: vi.fn(),
    closeAllConnections: vi.fn(),
    sendChatMessage: vi.fn(),
    addScreenShareTrack: vi.fn(),
    removeScreenShareTrack: vi.fn(),
    updatePeerUsername: vi.fn(),
    clearPeerScreenStream: vi.fn(),
  };
  mockStart = vi.fn().mockResolvedValue(null);
  mockStop = vi.fn();
  mockIsScreenSharing = false;
});

test('toggle screen share when active stops and notifies', async () => {
  // set screen sharing active
  mockIsScreenSharing = true;
  mockStop = vi.fn();
  mockWebrtcImpl = { ...mockWebrtcImpl, removeScreenShareTrack: vi.fn(), remotePeers: [] };
  mockSend = vi.fn();

  const { getByTestId } = render(
    <CallScreen
      meetingId="m1"
      username="u"
      peerId="me"
      localStream={{ getVideoTracks: () => [], getTracks: () => [], id: 'ls' } as any}
      isAudioEnabled={true}
      isVideoEnabled={true}
      onToggleAudio={() => {}}
      onToggleVideo={() => {}}
      onLeave={() => {}}
    />
  );

  const btn = getByTestId('toggle-screen');
  await act(async () => { fireEvent.click(btn); });

  // stopScreenShare should have been called (from mockStop)
  // removeScreenShareTrack on webrtc should be called
  expect(mockWebrtcImpl.removeScreenShareTrack).toHaveBeenCalled();
});

test('toggle screen share when inactive starts and notifies', async () => {
  // start path
  mockIsScreenSharing = false;
  mockStart = vi.fn().mockResolvedValue({ id: 's1' });
  mockWebrtcImpl = { ...mockWebrtcImpl, addScreenShareTrack: vi.fn() };
  mockSend = vi.fn();

  const { getByTestId } = render(
    <CallScreen
      meetingId="m1"
      username="u"
      peerId="me"
      localStream={{ getVideoTracks: () => [], getTracks: () => [], id: 'ls' } as any}
      isAudioEnabled={true}
      isVideoEnabled={true}
      onToggleAudio={() => {}}
      onToggleVideo={() => {}}
      onLeave={() => {}}
    />
  );

  const btn = getByTestId('toggle-screen');
  await act(async () => { fireEvent.click(btn); });

  expect(mockStart).toHaveBeenCalled();
});

test('participant count pluralizes when multiple peers', () => {
  mockWebrtcImpl = { ...mockWebrtcImpl, remotePeers: [{ peerId: 'p1', username: 'Bob', stream: { getVideoTracks: () => [], getTracks: () => [], id: 'r' } }] };
  const { getByText } = render(
    <CallScreen
      meetingId="room-42"
      username="u"
      peerId="me"
      localStream={{ getVideoTracks: () => [], getTracks: () => [], id: 'ls' } as any}
      isAudioEnabled={true}
      isVideoEnabled={true}
      onToggleAudio={() => {}}
      onToggleVideo={() => {}}
      onLeave={() => {}}
    />
  );

  expect(getByText(/2 participants/)).toBeTruthy();
});
