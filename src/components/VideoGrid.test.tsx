import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VideoGrid } from './VideoGrid';
import type { RemotePeer } from '../types';

describe('VideoGrid component', () => {
  const mockStream = {
    getVideoTracks: vi.fn().mockReturnValue([{ id: 'track-1' }]),
  } as unknown as MediaStream;

  const remotePeers: RemotePeer[] = [
    { peerId: '1', username: 'User 1', stream: mockStream, screenStream: null },
    { peerId: '2', username: 'User 2', stream: mockStream, screenStream: null },
  ];

  it('renders standard grid layout when no screen share', () => {
    const { container } = render(
      <VideoGrid
        localStream={mockStream}
        localScreenStream={null}
        localUsername="Local"
        remotePeers={remotePeers}
        isAudioMuted={false}
        isLocalScreenSharing={false}
      />
    );
    // 1 local + 2 remote = 3 tiles
    expect(container.querySelectorAll('.video-tile').length).toBe(3);
    expect(container.querySelector('.grid')).toBeInTheDocument();
  });

  it('renders screen share layout when remote is sharing', () => {
    const peersWithScreen: RemotePeer[] = [
      ...remotePeers,
      { peerId: '3', username: 'Sharer', stream: mockStream, screenStream: mockStream },
    ];
    const { container } = render(
      <VideoGrid
        localStream={mockStream}
        localScreenStream={null}
        localUsername="Local"
        remotePeers={peersWithScreen}
        isAudioMuted={false}
        isLocalScreenSharing={false}
      />
    );
    // 1 local + 3 remote cameras + 1 screen share = 5 tiles
    expect(container.querySelectorAll('.video-tile').length).toBe(5);
    expect(container.querySelector('.screen-share')).toBeInTheDocument();
  });

  it('renders screen share layout when local is sharing', () => {
    const { container } = render(
      <VideoGrid
        localStream={mockStream}
        localScreenStream={mockStream}
        localUsername="Local"
        remotePeers={remotePeers}
        isAudioMuted={false}
        isLocalScreenSharing={true}
      />
    );
    // 1 local camera + 2 remote cameras + 1 local screen share = 4 tiles
    expect(container.querySelectorAll('.video-tile').length).toBe(4);
    expect(container.querySelectorAll('.screen-share').length).toBe(1);
  });

  describe('grid classes', () => {
    const testGrid = (count: number, expectedClass: string) => {
      const peers = Array.from({ length: count - 1 }, (_, i) => ({
        peerId: `${i}`,
        username: `User ${i}`,
        stream: mockStream,
        screenStream: null,
      }));
      const { container } = render(
        <VideoGrid
          localStream={mockStream}
          localScreenStream={null}
          localUsername="Local"
          remotePeers={peers}
          isAudioMuted={false}
          isLocalScreenSharing={false}
        />
      );
      expect(container.querySelector('.grid')).toHaveClass(expectedClass);
    };

    it('uses correct classes for 1 tile', () => testGrid(1, 'grid-cols-1'));
    it('uses correct classes for 2 tiles', () => testGrid(2, 'grid-cols-1 md:grid-cols-2'));
    it('uses correct classes for 4 tiles', () => testGrid(4, 'grid-cols-1 sm:grid-cols-2'));
    it('uses correct classes for 6 tiles', () => testGrid(6, 'grid-cols-2 md:grid-cols-3'));
    it('uses correct classes for 8 tiles', () => testGrid(8, 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'));
  });
});
