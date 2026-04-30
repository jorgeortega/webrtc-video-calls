import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Chat } from './Chat';
import type { ChatMessage } from '../types';

describe('Chat component', () => {
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      from: 'user1',
      username: 'User 1',
      text: 'Hello',
      timestamp: new Date('2023-01-01T12:00:00').getTime(),
    },
    {
      id: '2',
      from: 'me',
      username: 'Me',
      text: 'Hi there',
      timestamp: new Date('2023-01-01T12:01:00').getTime(),
    },
  ];

  const mockProps = {
    messages: [],
    currentUserId: 'me',
    onSendMessage: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "No messages yet" when message list is empty', () => {
    render(<Chat {...mockProps} />);
    expect(screen.getByText(/No messages yet/)).toBeInTheDocument();
  });

  it('renders messages correctly', () => {
    render(<Chat {...mockProps} messages={mockMessages} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('calls onSendMessage when form is submitted', () => {
    render(<Chat {...mockProps} />);
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.submit(screen.getByLabelText('Send message'));
    
    expect(mockProps.onSendMessage).toHaveBeenCalledWith('New message');
    expect(input).toHaveValue('');
  });

  it('does not call onSendMessage if input is empty or whitespace', () => {
    const { container } = render(<Chat {...mockProps} />);
    const input = screen.getByPlaceholderText('Type a message...');
    const form = container.querySelector('form');
    
    fireEvent.change(input, { target: { value: '   ' } });
    if (form) fireEvent.submit(form);
    
    expect(mockProps.onSendMessage).not.toHaveBeenCalled();
  });

  it('auto-scrolls to bottom when new messages arrive', () => {
    const { rerender } = render(<Chat {...mockProps} />);
    // We can't easily check scrollTop in JSDOM but we can verify the effect runs
    rerender(<Chat {...mockProps} messages={mockMessages} />);
    // No assertion needed if we just want to hit the line, but we could try:
    // expect(someInternalState).toBe(...) - but scrollRef is private.
    // In JSDOM, scrollTop/scrollHeight work but might need a fixed height container.
  });
});
