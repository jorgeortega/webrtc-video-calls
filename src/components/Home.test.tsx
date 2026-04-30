import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Home } from './Home';
import * as routing from '../utils/routing';

vi.mock('../utils/routing', () => ({
  generateMeetingId: vi.fn().mockReturnValue('abcd-efgh-ijkl'),
  navigateToMeeting: vi.fn(),
}));

describe('Home component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Home />);
    expect(screen.getByText('Video Call')).toBeInTheDocument();
    expect(screen.getByText('Create New Meeting')).toBeInTheDocument();
  });

  it('navigates to new meeting when create button is clicked', () => {
    render(<Home />);
    fireEvent.click(screen.getByText('Create New Meeting'));
    expect(routing.generateMeetingId).toHaveBeenCalled();
    expect(routing.navigateToMeeting).toHaveBeenCalledWith('abcd-efgh-ijkl');
  });

  it('updates input value on change', () => {
    render(<Home />);
    const input = screen.getByPlaceholderText(/Enter meeting code/);
    fireEvent.change(input, { target: { value: 'test-meeting' } });
    expect(input).toHaveValue('test-meeting');
  });

  it('navigates to meeting when join form is submitted', () => {
    render(<Home />);
    const input = screen.getByPlaceholderText(/Enter meeting code/);
    const joinButton = screen.getByText('Join Meeting');
    
    fireEvent.change(input, { target: { value: 'test-meeting' } });
    fireEvent.click(joinButton);
    
    expect(routing.navigateToMeeting).toHaveBeenCalledWith('test-meeting');
  });

  it('does not navigate if join input is only whitespace', () => {
    const { container } = render(<Home />);
    const input = screen.getByPlaceholderText(/Enter meeting code/);
    
    fireEvent.change(input, { target: { value: '   ' } });
    const form = container.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    expect(routing.navigateToMeeting).not.toHaveBeenCalled();
  });
});
