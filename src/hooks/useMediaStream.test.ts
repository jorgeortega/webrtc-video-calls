import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

const fakeTrack = (kind = 'video') => ({
  kind,
  stop: vi.fn(),
  enabled: true,
});

const fakeStream = () => ({
  getTracks: () => [fakeTrack('video'), fakeTrack('audio')],
  getVideoTracks: () => [fakeTrack('video')],
  getAudioTracks: () => [fakeTrack('audio')],
  id: 'stream1',
});

vi.stubGlobal('navigator', {
  mediaDevices: {
    getUserMedia: vi.fn(async () => fakeStream()),
  },
});

import { useMediaStream } from './useMediaStream';

test('startMedia/stopMedia/toggle', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useMediaStream());
  await act(async () => {
    const s = await result.current.startMedia();
    expect(s).toBeTruthy();
  });

  expect(result.current.localStream).toBeTruthy();
  act(() => result.current.toggleAudio());
  act(() => result.current.toggleVideo());
  act(() => result.current.stopMedia());
  expect(result.current.localStream).toBeNull();
});
