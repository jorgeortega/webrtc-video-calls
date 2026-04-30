import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DeviceSelector } from './DeviceSelector';
import type { MediaDeviceOption } from '../types';

describe('DeviceSelector component', () => {
  const mockDevices: MediaDeviceOption[] = [
    { deviceId: '1', label: 'Device 1', kind: 'videoinput' },
    { deviceId: '2', label: 'Device 2', kind: 'videoinput' },
  ];

  it('renders correctly with selected device', () => {
    render(
      <DeviceSelector
        devices={mockDevices}
        selectedDeviceId="1"
        onSelect={vi.fn()}
        type="camera"
      />
    );
    expect(screen.getByText('Device 1')).toBeInTheDocument();
  });

  it('renders placeholder when no device selected', () => {
    render(
      <DeviceSelector
        devices={mockDevices}
        selectedDeviceId={null}
        onSelect={vi.fn()}
        type="camera"
      />
    );
    expect(screen.getByText('Select camera')).toBeInTheDocument();
  });

  it('renders microphone icon for microphone type', () => {
    const { container } = render(
      <DeviceSelector
        devices={mockDevices}
        selectedDeviceId="1"
        onSelect={vi.fn()}
        type="microphone"
      />
    );
    // Mic icon from lucide-react
    expect(container.querySelector('.lucide-mic')).toBeInTheDocument();
  });

  it('disables trigger button when disabled prop is true', () => {
    render(
      <DeviceSelector
        devices={mockDevices}
        selectedDeviceId="1"
        onSelect={vi.fn()}
        type="camera"
        disabled={true}
      />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // Testing Radix UI dropdowns can be tricky in jsdom without proper setup,
  // but we can try to trigger the open state.
  it('shows devices when clicked', async () => {
    const onSelect = vi.fn();
    render(
      <DeviceSelector
        devices={mockDevices}
        selectedDeviceId="1"
        onSelect={onSelect}
        type="camera"
      />
    );
    
    const trigger = screen.getByRole('button');
    fireEvent.pointerDown(trigger, { button: 0 });
    fireEvent.pointerUp(trigger, { button: 0 });
    
    // In Radix, the content is rendered in a Portal. 
    expect(await screen.findByTestId('device-item-2')).toBeInTheDocument();
  });

  it('shows "No cameras found" when devices list is empty', async () => {
    render(
      <DeviceSelector
        devices={[]}
        selectedDeviceId={null}
        onSelect={vi.fn()}
        type="camera"
      />
    );
    
    const trigger = screen.getByRole('button');
    fireEvent.pointerDown(trigger, { button: 0 });
    fireEvent.pointerUp(trigger, { button: 0 });
    
    expect(await screen.findByTestId('no-devices')).toBeInTheDocument();
  });

  it('calls onSelect when a device is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <DeviceSelector
        devices={mockDevices}
        selectedDeviceId="1"
        onSelect={onSelect}
        type="camera"
      />
    );
    
    const trigger = screen.getByRole('button');
    fireEvent.pointerDown(trigger, { button: 0 });
    fireEvent.pointerUp(trigger, { button: 0 });
    
    const device2 = await screen.findByTestId('device-item-2');
    fireEvent.click(device2);
    
    expect(onSelect).toHaveBeenCalledWith('2');
  });
});
