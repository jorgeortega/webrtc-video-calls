import { render, act } from '@testing-library/react';
import { vi } from 'vitest';

const lobbyMount = vi.fn();
vi.mock('./components/Lobby', () => ({ Lobby: () => { lobbyMount(); return <div>LOBBY</div>; } }));
vi.mock('./components/Home', () => ({ Home: () => <div>HOME</div> }));

import App from './App';

test('hashchange updates view to meeting', async () => {
  // start at home
  window.location.hash = '#/'
  const { rerender } = render(<App />);

  // change to meeting
  await act(async () => {
    window.location.hash = '#/meeting/xyz';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    rerender(<App />);
  });

  expect(lobbyMount).toHaveBeenCalled();
});
