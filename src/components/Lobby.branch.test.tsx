import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../hooks/useMediaDevices', () => ({
  useMediaDevices: () => ({
    cameras: [],
    microphones: [],
    selectedCameraId: null,
    selectedMicrophoneId: null,
    setSelectedCameraId: vi.fn(),
    setSelectedMicrophoneId: vi.fn(),
    refreshDevices: vi.fn(),
  }),
}));

vi.mock('../hooks/useMediaStream', () => ({
  useMediaStream: (_opts: any) => ({
    localStream: { id: 'ls' } as any,
    isAudioEnabled: true,
    isVideoEnabled: true,
    error: null,
    startMedia: vi.fn().mockResolvedValue(undefined),
    toggleAudio: vi.fn(),
    toggleVideo: vi.fn(),
  }),
}));

import { Lobby } from './Lobby';

beforeEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
  localStorage.clear();
});

test('join succeeds and calls onJoin with trimmed username', async () => {
  const onJoin = vi.fn();
  const { getByLabelText, getByText } = render(<Lobby meetingId="m1" onJoin={onJoin} />);

  const input = getByLabelText('Your name') as HTMLInputElement;
  await act(async () => { fireEvent.change(input, { target: { value: '  Alice  ' } }); });

  const joinBtn = getByText('Join Meeting');
  expect(joinBtn).not.toBeDisabled();

  await act(async () => { fireEvent.click(joinBtn); });

  expect(onJoin).toHaveBeenCalledWith('Alice', expect.any(Object), true, true);
  expect(localStorage.getItem('video-call-username')).toBe('  Alice  ');
});

test('join failure logs error and resets isJoining', async () => {
  const onJoin = vi.fn().mockImplementation(() => { throw new Error('boom'); });
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  const { getByLabelText, getByText } = render(<Lobby meetingId="m1" onJoin={onJoin} />);
  const input = getByLabelText('Your name') as HTMLInputElement;
  await act(async () => { fireEvent.change(input, { target: { value: 'Bob' } }); });

  const joinBtn = getByText('Join Meeting');
  await act(async () => { fireEvent.click(joinBtn); });

  // after error, button text should not remain 'Joining...'
  expect(joinBtn.textContent).toBe('Join Meeting');
  expect(consoleError).toHaveBeenCalled();
  consoleError.mockRestore();
});

test('copy link shows copied state then reverts', async () => {
  const write = vi.fn().mockResolvedValue(undefined);
  (navigator as any).clipboard = { writeText: write };

  vi.useFakeTimers();
  const { getByText } = render(<Lobby meetingId="room-99" onJoin={() => {}} />);
  const copyBtn = getByText(/Copy meeting link/i);

  await act(async () => { fireEvent.click(copyBtn); });
  expect(write).toHaveBeenCalled();
  // should show 'Link copied!'
  expect(getByText(/Link copied!/i)).toBeTruthy();

  // advance timers to revert
  act(() => { vi.advanceTimersByTime(2000); });
  expect(getByText(/Copy meeting link/i)).toBeTruthy();
  vi.useRealTimers();
});
