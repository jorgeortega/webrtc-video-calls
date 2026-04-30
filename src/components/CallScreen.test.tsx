import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock hooks before importing component
const mockSend = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('../hooks/useSignaling', () => ({
  useSignaling: () => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    send: mockSend,
  }),
}));

const mockAddScreenShareTrack = vi.fn();
const mockRemoveScreenShareTrack = vi.fn();
const mockCloseAllConnections = vi.fn();
const mockSendChatMessage = vi.fn();

vi.mock('../hooks/useWebRTC', () => ({
  useWebRTC: () => ({
    remotePeers: [],
    closeAllConnections: mockCloseAllConnections,
    sendChatMessage: mockSendChatMessage,
    addScreenShareTrack: mockAddScreenShareTrack,
    removeScreenShareTrack: mockRemoveScreenShareTrack,
    remotePeersLength: 0,
  }),
}));

const fakeTrack = () => ({ stop: vi.fn(), enabled: true });
const fakeStream = { getTracks: () => [fakeTrack()], getVideoTracks: () => [fakeTrack()], getAudioTracks: () => [fakeTrack()], id: 's1' } as any;
const mockStart = vi.fn(async () => fakeStream);
const mockStop = vi.fn();

vi.mock('../hooks/useScreenShare', () => ({
  useScreenShare: () => ({
    screenStream: null,
    isScreenSharing: false,
    startScreenShare: mockStart,
    stopScreenShare: mockStop,
  }),
}));

const mockAddMessage = vi.fn();
const mockMarkAsRead = vi.fn();

vi.mock('../hooks/useChat', () => ({
  useChat: () => ({
    messages: [],
    unreadCount: 0,
    addMessage: mockAddMessage,
    markAsRead: mockMarkAsRead,
  }),
}));

import { CallScreen } from './CallScreen';

test('renders and toggles chat and screen share', async () => {
  render(
    <CallScreen
      meetingId="meet-1"
      username="user"
      peerId="peer-1"
      localStream={fakeStream}
      isAudioEnabled={true}
      isVideoEnabled={true}
      onToggleAudio={() => {}}
      onToggleVideo={() => {}}
      onLeave={() => {}}
    />
  );

  // Chat toggle
  const chatButton = screen.getByLabelText(/Open chat/i);
  fireEvent.click(chatButton);
  expect(mockMarkAsRead).toHaveBeenCalled();

  // Screen share (async)
  const shareButton = screen.getByLabelText(/Share screen/i);
  fireEvent.click(shareButton);

  await waitFor(() => expect(mockStart).toHaveBeenCalled());
  await waitFor(() => expect(mockAddScreenShareTrack).toHaveBeenCalled());
  expect(mockSend).toHaveBeenCalled();
});
