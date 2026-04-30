import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoPreview } from './VideoPreview';

describe('VideoPreview component', () => {
  const mockStream = {
    getTracks: vi.fn().mockReturnValue([]),
  } as unknown as MediaStream;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders video when stream is provided and video is enabled', () => {
    render(<VideoPreview stream={mockStream} isVideoEnabled={true} />);
    const video = screen.getByTestId('video-element');
    expect(video).toBeInTheDocument();
  });

  it('renders initials when video is enabled but no stream', () => {
    render(<VideoPreview stream={null} isVideoEnabled={true} username="Test User" />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders VideoOff icon when video is disabled', () => {
    const { container } = render(<VideoPreview stream={mockStream} isVideoEnabled={false} />);
    // lucide-react icons usually have a data-testid or class we can check, or just check for the text "Camera off"
    expect(screen.getByText('Camera off')).toBeInTheDocument();
    // Check for the svg (VideoOff)
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders username overlay when provided', () => {
    render(<VideoPreview stream={null} isVideoEnabled={false} username="Test User" />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders "?" when no username and video is enabled but no stream', () => {
    render(<VideoPreview stream={null} isVideoEnabled={true} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});

// Since <video> might not have a default role in all environments:
import { configure } from '@testing-library/react';
configure({ testIdAttribute: 'data-testid' });
