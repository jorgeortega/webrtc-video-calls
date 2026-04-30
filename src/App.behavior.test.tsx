import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';

// Stub components to observe props
vi.mock('./components/Home', () => ({ Home: () => <div>HOME</div> }));

const fakeTrack = () => ({ stop: vi.fn() });
const fakeStream = { getTracks: () => [fakeTrack()], getVideoTracks: () => [fakeTrack()], getAudioTracks: () => [fakeTrack()], id: 's1' } as unknown as MediaStream;
const lobbyJoin = vi.fn();
vi.mock('./components/Lobby', () => ({ Lobby: ({ meetingId, onJoin }: { meetingId: string; onJoin?: (username: string, stream: MediaStream, v1: boolean, v2: boolean) => void }) => { lobbyJoin(meetingId); if (onJoin) onJoin('u', fakeStream, true, true); return <div>LOBBY</div>; } }));

const callProps: Record<string, any> = {};
vi.mock('./components/CallScreen', () => ({ CallScreen: (props: Record<string, unknown>) => { Object.assign(callProps, props); return <div>CALL</div>; } }));

vi.mock('./utils/routing', () => ({
  parseRoute: () => ({ view: 'meeting', meetingId: 'meet-123' }),
  generatePeerId: () => 'peer-1',
  navigateToHome: vi.fn(),
}));

import App from './App';

test('navigates from lobby to call via onJoin and handles leave', async () => {
  await act(async () => {
    render(<App />);
  });

  // Lobby should be mounted and onJoin called
  expect(lobbyJoin).toHaveBeenCalledWith('meet-123');

  // After join, CallScreen should render with props
  expect(callProps.meetingId).toBe('meet-123');
  expect(callProps.username).toBe('u');

  // Invoke onLeave and expect navigateToHome called (mocked)
  act(() => callProps.onLeave());
  // parseRoute mock's navigateToHome is a vi.fn, but we didn't import it; ensure App falls back to Home
  expect(screen.getByText(/HOME/i)).toBeTruthy();
});
