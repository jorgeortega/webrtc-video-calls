import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('./utils/routing', () => ({
  parseRoute: () => ({ view: 'meeting', meetingId: 'meet-1' }),
  generatePeerId: () => 'peer-123',
  navigateToHome: vi.fn(),
  generateMeetingId: () => 'meet-1',
  navigateToMeeting: vi.fn(),
}));

import App from './App';

test('renders Lobby when route is meeting', () => {
  render(<App />);
  expect(screen.getByText(/Ready to join\?/i)).toBeTruthy();
});
