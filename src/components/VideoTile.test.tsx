import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VideoTile } from './VideoTile';

describe('VideoTile component', () => {
  const mockStream = {
    getVideoTracks: vi.fn().mockReturnValue([{ id: 'track-1' }]),
  } as unknown as MediaStream;

  it('renders correctly with stream and username', () => {
    render(<VideoTile stream={mockStream} username="User 1" />);
    expect(screen.getByText('User 1')).toBeInTheDocument();
    // Use container.querySelector since video might not have a role
    // @ts-ignore
    expect(document.querySelector('video')).toBeInTheDocument();
  });

  it('renders "You" suffix for local user', () => {
    render(<VideoTile stream={mockStream} username="User 1" isLocal={true} />);
    expect(screen.getByText('User 1 (You)')).toBeInTheDocument();
  });

  it('renders initials when no video track', () => {
    const streamNoVideo = {
      getVideoTracks: vi.fn().mockReturnValue([]),
    } as unknown as MediaStream;
    render(<VideoTile stream={streamNoVideo} username="User 1" />);
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('renders "?" when no username and no video track', () => {
    const streamNoVideo = {
      getVideoTracks: vi.fn().mockReturnValue([]),
    } as unknown as MediaStream;
    render(<VideoTile stream={streamNoVideo} username="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('shows screen share indicator', () => {
    render(<VideoTile stream={mockStream} username="User 1" isScreenShare={true} />);
    expect(screen.getByText('Screen')).toBeInTheDocument();
  });

  it('shows muted indicator', () => {
    const { container } = render(
      <VideoTile stream={mockStream} username="User 1" isMuted={true} />
    );
    expect(container.querySelector('.lucide-mic-off')).toBeInTheDocument();
  });

  it('shows connecting overlay when no stream', () => {
    render(<VideoTile stream={null} username="User 1" />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });
});
