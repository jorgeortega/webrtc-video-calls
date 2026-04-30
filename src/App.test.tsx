import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('./utils/routing', () => ({
  parseRoute: () => ({ view: 'home' }),
  generatePeerId: () => 'peer-123',
  navigateToHome: vi.fn(),
  generateMeetingId: () => 'meet-1',
  navigateToMeeting: vi.fn(),
}));

import App from './App';

test('renders Home view when route is home', () => {
  render(<App />);
  expect(screen.getByText(/Video Call/i)).toBeTruthy();
});
