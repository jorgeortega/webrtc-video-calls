import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';

const fakeTrack = () => ({ stop: vi.fn(), enabled: true });
const fakeStream = { getTracks: () => [fakeTrack()], getVideoTracks: () => [fakeTrack()], getAudioTracks: () => [fakeTrack()], id: 's1' } as any;

const mockStartMedia = vi.fn(async () => fakeStream);
const mockToggleAudio = vi.fn();
const mockToggleVideo = vi.fn();

vi.mock('../hooks/useMediaDevices', () => ({
  useMediaDevices: () => ({
    cameras: [{ deviceId: 'cam1', label: 'c1', kind: 'videoinput' }],
    microphones: [{ deviceId: 'mic1', label: 'm1', kind: 'audioinput' }],
    speakers: [],
    selectedCameraId: 'cam1',
    selectedMicrophoneId: 'mic1',
    setSelectedCameraId: () => {},
    setSelectedMicrophoneId: () => {},
    refreshDevices: () => Promise.resolve(),
    hasPermissions: true,
    error: null,
  }),
}));

vi.mock('../hooks/useMediaStream', () => ({
  useMediaStream: () => ({
    localStream: fakeStream,
    isAudioEnabled: true,
    isVideoEnabled: true,
    error: null,
    startMedia: mockStartMedia,
    toggleAudio: mockToggleAudio,
    toggleVideo: mockToggleVideo,
    switchCamera: async () => {},
    switchMicrophone: async () => {},
  }),
}));

vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => ''),
  setItem: vi.fn(),
});

vi.stubGlobal('navigator', {
  clipboard: { writeText: vi.fn() },
});

import { Lobby } from './Lobby';

test('renders lobby and allows join and copy', async () => {
  const onJoin = vi.fn();
  render(<Lobby meetingId="meet-1" onJoin={onJoin} />);

  // copy link
  const copyBtn = screen.getByText(/Copy meeting link/i);
  fireEvent.click(copyBtn);
  expect((navigator as any).clipboard.writeText).toHaveBeenCalled();

  // username input
  const input = screen.getByPlaceholderText(/Enter your name/i);
  fireEvent.change(input, { target: { value: 'Alice' } });

  const joinBtn = screen.getByText(/Join Meeting/i);
  await act(async () => {
    fireEvent.click(joinBtn);
  });

  expect(onJoin).toHaveBeenCalled();
});
