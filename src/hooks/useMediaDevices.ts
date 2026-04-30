import { useState, useEffect, useCallback } from 'react';
import type { MediaDeviceOption } from '../types';

interface UseMediaDevicesReturn {
  cameras: MediaDeviceOption[];
  microphones: MediaDeviceOption[];
  speakers: MediaDeviceOption[];
  selectedCameraId: string | null;
  selectedMicrophoneId: string | null;
  setSelectedCameraId: (deviceId: string) => void;
  setSelectedMicrophoneId: (deviceId: string) => void;
  refreshDevices: () => Promise<void>;
  hasPermissions: boolean;
  error: string | null;
}

export function useMediaDevices(): UseMediaDevicesReturn {
  const [cameras, setCameras] = useState<MediaDeviceOption[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceOption[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceOption[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoInputs: MediaDeviceOption[] = [];
      const audioInputs: MediaDeviceOption[] = [];
      const audioOutputs: MediaDeviceOption[] = [];

      devices.forEach((device, index) => {
        const option: MediaDeviceOption = {
          deviceId: device.deviceId,
          label: device.label || `${device.kind} ${index + 1}`,
          kind: device.kind,
        };

        if (device.kind === 'videoinput') {
          videoInputs.push(option);
        } else if (device.kind === 'audioinput') {
          audioInputs.push(option);
        } else if (device.kind === 'audiooutput') {
          audioOutputs.push(option);
        }
      });

      setCameras(videoInputs);
      setMicrophones(audioInputs);
      setSpeakers(audioOutputs);

      // Check if we have labels (indicates permissions granted)
      const hasLabels = devices.some(d => d.label !== '');
      setHasPermissions(hasLabels);

      // Set default selections if not already set
      if (videoInputs.length > 0) {
        setSelectedCameraId(prev => prev || videoInputs[0].deviceId);
      }
      if (audioInputs.length > 0) {
        setSelectedMicrophoneId(prev => prev || audioInputs[0].deviceId);
      }

      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enumerate devices';
      setError(message);
      console.error('Error enumerating devices:', err);
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    await enumerateDevices();
  }, [enumerateDevices]);

  // Initial enumeration
  useEffect(() => {
    const timer = setTimeout(() => {
      enumerateDevices();
    }, 0);
    return () => clearTimeout(timer);
  }, [enumerateDevices]);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      enumerateDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [enumerateDevices]);

  return {
    cameras,
    microphones,
    speakers,
    selectedCameraId,
    selectedMicrophoneId,
    setSelectedCameraId,
    setSelectedMicrophoneId,
    refreshDevices,
    hasPermissions,
    error,
  };
}
