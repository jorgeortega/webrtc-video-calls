import { render, act } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';

// Mock hooks used by CallScreen
const sendMock = vi.fn();
const connectMock = vi.fn();
const disconnectMock = vi.fn();
const closeAllConnectionsMock = vi.fn();

vi.mock('../hooks/useSignaling', () => ({
  useSignaling: () => ({ connect: connectMock, disconnect: disconnectMock, send: sendMock, isConnected: false }),
}));

vi.mock('../hooks/useWebRTC', () => ({
  useWebRTC: () => ({ remotePeers: [], addScreenShareTrack: vi.fn(), removeScreenShareTrack: vi.fn(), sendChatMessage: vi.fn(), closeAllConnections: closeAllConnectionsMock, initializeIceServers: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock('../hooks/useScreenShare', () => ({
  useScreenShare: () => ({ screenStream: null, isScreenSharing: false, startScreenShare: vi.fn(), stopScreenShare: vi.fn() }),
}));

vi.mock('../hooks/useChat', () => ({
  useChat: () => ({ messages: [], unreadCount: 0, addMessage: vi.fn(), markAsRead: vi.fn() }),
}));

import { CallScreen } from './CallScreen';

test('sends join after mount and cleans up on unmount', async () => {
  vi.useFakeTimers();
  const onLeave = vi.fn();

  const fakeStream = { id: 'l1', getVideoTracks: () => [], getTracks: () => [], getAudioTracks: () => [] } as any;

  const { unmount } = render(
    <CallScreen
      meetingId="m1"
      username="u"
      peerId="p"
      localStream={fakeStream}
      isAudioEnabled={true}
      isVideoEnabled={true}
      onToggleAudio={() => {}}
      onToggleVideo={() => {}}
      onLeave={onLeave}
    />
  );

  // initialization happens in an async function inside useEffect
  // we need to wait for microtasks to flush
  await act(async () => {
    await Promise.resolve();
  });

  // advance timers to trigger join send
  act(() => {
    vi.advanceTimersByTime(500);
  });

  expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'join', roomId: 'm1' }));

  // unmount should cleanup
  unmount();
  expect(closeAllConnectionsMock).toHaveBeenCalled();
  expect(disconnectMock).toHaveBeenCalled();

  vi.useRealTimers();
});