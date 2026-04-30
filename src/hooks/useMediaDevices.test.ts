import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { vi } from 'vitest';

const fakeDevices = [
  { deviceId: 'cam1', kind: 'videoinput', label: 'Camera 1' },
  { deviceId: 'mic1', kind: 'audioinput', label: 'Microphone 1' },
  { deviceId: 'spk1', kind: 'audiooutput', label: 'Speaker 1' },
];

vi.stubGlobal('navigator', {
  mediaDevices: {
    enumerateDevices: vi.fn(async () => fakeDevices),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

import { useMediaDevices } from './useMediaDevices';

test('enumerates devices and sets defaults', async () => {
  const { result } = renderHook(() => useMediaDevices());
  // wait for initial effect
  await waitFor(() => {
    expect(result.current.cameras.length).toBe(1);
  });

  expect(result.current.microphones.length).toBe(1);
  expect(result.current.speakers.length).toBe(1);
  expect(result.current.selectedCameraId).toBe('cam1');
});
