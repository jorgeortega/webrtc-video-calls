import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

const fakeTrack = (kind = 'video') => ({ stop: vi.fn(), enabled: true, kind });
const initialStream = { getTracks: () => [fakeTrack('video'), fakeTrack('audio')], getVideoTracks: () => [fakeTrack('video')], getAudioTracks: () => [fakeTrack('audio')], removeTrack: () => {}, id: 's1' } as any;
const newVideoStream = { getVideoTracks: () => [fakeTrack('video-new')], getTracks: () => [fakeTrack('video-new')], removeTrack: () => {}, id: 's2' } as any;
const newAudioStream = { getAudioTracks: () => [fakeTrack('audio-new')], getTracks: () => [fakeTrack('audio-new')], removeTrack: () => {}, id: 's3' } as any;

const getUserMediaMock = vi.fn()
  .mockImplementationOnce(async () => initialStream)
  .mockImplementationOnce(async () => newVideoStream)
  .mockImplementationOnce(async () => newAudioStream);

vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: getUserMediaMock } } as any);

import { useMediaStream } from './useMediaStream';

test('startMedia with options and switchCamera/switchMicrophone', async () => {
  const { result } = renderHook(() => useMediaStream({}));

  await act(async () => {
    const s = await result.current.startMedia({ video: true, audio: true });
    expect(s).toBeTruthy();
  });

  // switch camera
  await act(async () => {
    await result.current.switchCamera('cam-new');
  });

  // switch microphone
  await act(async () => {
    await result.current.switchMicrophone('mic-new');
  });

  // toggle audio/video
  act(() => result.current.toggleAudio());
  act(() => result.current.toggleVideo());

  // stop
  act(() => result.current.stopMedia());
  expect(result.current.localStream).toBeNull();
});
