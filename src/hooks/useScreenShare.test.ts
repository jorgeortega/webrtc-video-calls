import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

const fakeVideoTrack = () => ({ stop: vi.fn(), onended: undefined });
const fakeStream = () => ({ getVideoTracks: () => [fakeVideoTrack()], getTracks: () => [fakeVideoTrack()], id: 'display1' });

vi.stubGlobal('navigator', {
  mediaDevices: {
    getDisplayMedia: vi.fn(async () => fakeStream()),
  },
});

import { useScreenShare } from './useScreenShare';

test('start and stop screen share', async () => {
  const { result } = renderHook(() => useScreenShare());
  await act(async () => {
    const s = await result.current.startScreenShare();
    expect(s).toBeTruthy();
  });
  act(() => result.current.stopScreenShare());
  expect(result.current.screenStream).toBeNull();
});
