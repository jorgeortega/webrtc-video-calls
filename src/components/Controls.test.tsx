import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Controls } from './Controls';

describe('Controls component', () => {
  const mockProps = {
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    isChatOpen: false,
    unreadMessages: 0,
    meetingId: 'test-room',
    onToggleAudio: vi.fn(),
    onToggleVideo: vi.fn(),
    onToggleScreenShare: vi.fn(),
    onToggleChat: vi.fn(),
    onLeave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onToggleAudio when mic button is clicked', () => {
    render(<Controls {...mockProps} />);
    fireEvent.click(screen.getByLabelText('Mute'));
    expect(mockProps.onToggleAudio).toHaveBeenCalled();
  });

  it('renders Unmute label when audio is disabled', () => {
    render(<Controls {...mockProps} isAudioEnabled={false} />);
    expect(screen.getByLabelText('Unmute')).toBeInTheDocument();
  });

  it('calls onToggleVideo when video button is clicked', () => {
    render(<Controls {...mockProps} />);
    fireEvent.click(screen.getByLabelText('Stop video'));
    expect(mockProps.onToggleVideo).toHaveBeenCalled();
  });

  it('renders Start video label when video is disabled', () => {
    render(<Controls {...mockProps} isVideoEnabled={false} />);
    expect(screen.getByLabelText('Start video')).toBeInTheDocument();
  });

  it('calls onToggleScreenShare when screen button is clicked', () => {
    render(<Controls {...mockProps} />);
    fireEvent.click(screen.getByLabelText('Share screen'));
    expect(mockProps.onToggleScreenShare).toHaveBeenCalled();
  });

  it('renders Stop sharing label when screen sharing is enabled', () => {
    render(<Controls {...mockProps} isScreenSharing={true} />);
    expect(screen.getByLabelText('Stop sharing')).toBeInTheDocument();
  });

  it('calls onToggleChat when chat button is clicked', () => {
    render(<Controls {...mockProps} />);
    fireEvent.click(screen.getByLabelText('Open chat'));
    expect(mockProps.onToggleChat).toHaveBeenCalled();
  });

  it('shows unread messages badge', () => {
    render(<Controls {...mockProps} unreadMessages={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows "9+" badge for many unread messages', () => {
    render(<Controls {...mockProps} unreadMessages={15} />);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('handles copy link correctly', async () => {
    render(<Controls {...mockProps} />);
    const copyButton = screen.getByLabelText('Copy invite link');
    
    await act(async () => {
      fireEvent.click(copyButton);
    });
    
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByLabelText('Copied!')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(screen.getByLabelText('Copy invite link')).toBeInTheDocument();
  });

  it('does not show badge when badge is undefined', () => {
    render(<Controls {...mockProps} unreadMessages={0} />);
    // When unreadMessages is 0, the badge prop passed to ControlButton is 0, which doesn't show the span.
    // But we also want to test when badge is totally undefined.
    // In Controls.tsx, badge={isChatOpen ? 0 : unreadMessages}.
    // So if isChatOpen is true, badge is 0.
    render(<Controls {...mockProps} isChatOpen={true} />);
    const badges = document.querySelectorAll('.bg-blue-600');
    expect(badges.length).toBe(0);
  });
});
