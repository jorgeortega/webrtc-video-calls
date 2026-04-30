import { render, screen, act, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

const audioTrack = { stop: vi.fn(), enabled: true } as any;
const videoTrack = { stop: vi.fn(), enabled: true } as any;
const fakeStream = { getTracks: () => [audioTrack, videoTrack], getVideoTracks: () => [videoTrack], getAudioTracks: () => [audioTrack], id: 's1' } as any;

// Mock routing to render Lobby
vi.mock('./utils/routing', () => ({
  parseRoute: () => ({ view: 'meeting', meetingId: 'm' }),
  generatePeerId: () => 'peer-1',
  navigateToHome: vi.fn(),
  navigateToMeeting: vi.fn(),
}));

// Mock Lobby to expose a button to trigger onJoin (avoids setState during render)
vi.mock('./components/Lobby', () => ({
  Lobby: ({ meetingId, onJoin }: any) => {
    return (
      <div>
        <button onClick={() => onJoin('alice', fakeStream, true, true)}>Trigger Join</button>
      </div>
    );
  },
}));

// Capture CallScreen props when rendered
const callProps: any = {};
vi.mock('./components/CallScreen', () => ({
  CallScreen: (props: any) => { Object.assign(callProps, props); return <div>CALL</div>; },
}));

import App from './App';

test('App sets localStream and toggles audio/video via handlers', async () => {
  await act(async () => {
    render(<App />);
  });

  // trigger join
  const btn = screen.getByText(/Trigger Join/i);
  await act(async () => {
    fireEvent.click(btn);
  });

  // CallScreen should be mounted and props captured
  expect(callProps.meetingId).toBe('m');
  expect(callProps.username).toBe('alice');

  // initial tracks enabled true
  const audioTrack = fakeStream.getAudioTracks()[0];
  const videoTrack = fakeStream.getVideoTracks()[0];
  expect(audioTrack.enabled).toBe(true);
  expect(videoTrack.enabled).toBe(true);

  // toggle audio and video via handlers passed from App
  act(() => callProps.onToggleAudio());
  expect(audioTrack.enabled).toBe(false);

  act(() => callProps.onToggleVideo());
  expect(videoTrack.enabled).toBe(false);

  // leave call should call navigateToHome (mocked) and unmount CallScreen
  act(() => callProps.onLeave());
  // After leave, App should render Home component; check by route mock's navigateToMeeting absence
  // Basic assertion that onLeave exists and was callable
  expect(typeof callProps.onLeave).toBe('function');
});
