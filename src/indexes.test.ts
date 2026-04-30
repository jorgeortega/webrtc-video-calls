import { Home, Lobby, CallScreen } from './components';
import { useMediaDevices, useMediaStream } from './hooks';

test('re-exports exist', () => {
  expect(Home).toBeDefined();
  expect(Lobby).toBeDefined();
  expect(CallScreen).toBeDefined();
  expect(useMediaDevices).toBeDefined();
  expect(useMediaStream).toBeDefined();
});
