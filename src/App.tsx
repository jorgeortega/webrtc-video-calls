import { useState, useEffect, useCallback } from 'react';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { CallScreen } from './components/CallScreen';
import { parseRoute, navigateToHome, generatePeerId } from './utils/routing';

type AppView = 'home' | 'lobby' | 'call';

interface AppState {
  view: AppView;
  meetingId: string | null;
  username: string | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    const route = parseRoute();
    return {
      view: route.view === 'meeting' ? 'lobby' : 'home',
      meetingId: route.meetingId || null,
      username: null,
      isAudioEnabled: true,
      isVideoEnabled: true,
    };
  });

  const [peerId] = useState(() => generatePeerId());

  // Store stream in state for use in call
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Toggle audio on the stored stream
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAppState(prev => ({ ...prev, isAudioEnabled: audioTrack.enabled }));
      }
    }
  }, [localStream]);

  // Toggle video on the stored stream
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setAppState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      }
    }
  }, [localStream]);

  // Stop media
  const stopMedia = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  // Handle hash change for routing
  useEffect(() => {
    const handleHashChange = () => {
      const route = parseRoute();
      if (route.view === 'home') {
        setAppState({
          view: 'home',
          meetingId: null,
          username: null,
          isAudioEnabled: true,
          isVideoEnabled: true,
        });
      } else if (route.view === 'meeting' && route.meetingId) {
        // Only go to lobby if not already in call for this meeting
        if (appState.view !== 'call' || appState.meetingId !== route.meetingId) {
          setAppState((prev) => ({
            ...prev,
            view: 'lobby',
            meetingId: route.meetingId!,
          }));
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [appState.view, appState.meetingId]);

  const handleJoinFromLobby = useCallback((username: string, stream: MediaStream, isAudioEnabled: boolean, isVideoEnabled: boolean) => {
    setLocalStream(stream);
    setAppState((prev) => ({
      ...prev,
      view: 'call',
      username,
      isAudioEnabled,
      isVideoEnabled,
    }));
  }, []);

  const handleLeaveCall = useCallback(() => {
    stopMedia();
    setLocalStream(null);
    navigateToHome();
    setAppState({
      view: 'home',
      meetingId: null,
      username: null,
      isAudioEnabled: true,
      isVideoEnabled: true,
    });
  }, [stopMedia]);

  // Render based on current view
  if (appState.view === 'home') {
    return <Home />;
  }

  if (appState.view === 'lobby' && appState.meetingId) {
    return (
      <Lobby
        meetingId={appState.meetingId}
        onJoin={handleJoinFromLobby}
      />
    );
  }

  if (appState.view === 'call' && appState.meetingId && appState.username && localStream) {
    return (
      <CallScreen
        meetingId={appState.meetingId}
        username={appState.username}
        peerId={peerId}
        localStream={localStream}
        isAudioEnabled={appState.isAudioEnabled}
        isVideoEnabled={appState.isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeave={handleLeaveCall}
      />
    );
  }

  // Fallback to home
  return <Home />;
}
