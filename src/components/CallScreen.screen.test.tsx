import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';

// Mock Controls to expose toggle button
vi.mock('./Controls', () => ({
  Controls: ({ onToggleScreenShare, ...rest }: any) => (
    <div>
      <button data-testid="toggle-screen" onClick={onToggleScreenShare}>toggle</button>
    </div>
  ),
}));

const sendMock = vi.fn();
const connectMock = vi.fn();
const disconnectMock = vi.fn();
const addScreenMock = vi.fn();
const removeScreenMock = vi.fn();

vi.mock('../hooks/useSignaling', () => ({
  useSignaling: () => ({ connect: connectMock, disconnect: disconnectMock, send: sendMock, isConnected: true }),
}));

vi.mock('../hooks/useWebRTC', () => ({
  useWebRTC: () => ({ remotePeers: [], addScreenShareTrack: addScreenMock, removeScreenShareTrack: removeScreenMock, sendChatMessage: vi.fn(), closeAllConnections: vi.fn(), initializeIceServers: vi.fn().mockResolvedValue(undefined) }),
}));


// We'll control startScreenShare via mock
let startScreenShareMock = vi.fn();
vi.mock('../hooks/useScreenShare', () => ({
  useScreenShare: () => ({ screenStream: null, isScreenSharing: false, startScreenShare: startScreenShareMock, stopScreenShare: vi.fn() }),
}));

vi.mock('../hooks/useChat', () => ({ useChat: () => ({ messages: [], unreadCount: 0, addMessage: vi.fn(), markAsRead: vi.fn() }) }));

import { CallScreen } from './CallScreen';

test('successful screen share starts and signals', async () => {
  startScreenShareMock = vi.fn(async () => ({ id: 's1', getTracks: () => [{ id: 's1' }] } as any));


  const fakeStream = { id: 'l1', getVideoTracks: () => [], getTracks: () => [], getAudioTracks: () => [] } as any;
  const { getByTestId } = render(
    <CallScreen meetingId="m1" username="u" peerId="p" localStream={fakeStream} isAudioEnabled={true} isVideoEnabled={true} onToggleAudio={() => {}} onToggleVideo={() => {}} onLeave={() => {}} />
  );

  await act(async () => {
    fireEvent.click(getByTestId('toggle-screen'));
  });

  expect(addScreenMock).toHaveBeenCalled();
  expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'screen-share-started' }));
});

test('screen share cancellation logs', async () => {
  const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  startScreenShareMock = vi.fn(async () => { throw new Error('user cancel'); });

  const fakeStream = { id: 'l1', getVideoTracks: () => [], getTracks: () => [], getAudioTracks: () => [] } as any;
  const { getByTestId } = render(
    <CallScreen meetingId="m1" username="u" peerId="p" localStream={fakeStream} isAudioEnabled={true} isVideoEnabled={true} onToggleAudio={() => {}} onToggleVideo={() => {}} onLeave={() => {}} />
  );

  await act(async () => {
    fireEvent.click(getByTestId('toggle-screen'));
  });

  expect(consoleLog).toHaveBeenCalled();
  consoleLog.mockRestore();
});