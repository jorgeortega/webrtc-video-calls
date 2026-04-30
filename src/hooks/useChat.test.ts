import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useChat } from './useChat';
import type { ChatMessage } from '../types';

describe('useChat hook', () => {
  const mockMessage: ChatMessage = {
    id: '1',
    from: 'user1',
    username: 'User 1',
    text: 'Hello',
    timestamp: Date.now(),
  };

  it('should initialize with empty messages and zero unread count', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should add a message and increment unread count', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addMessage(mockMessage);
    });
    expect(result.current.messages).toEqual([mockMessage]);
    expect(result.current.unreadCount).toBe(1);
  });

  it('should mark messages as read', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addMessage(mockMessage);
    });
    expect(result.current.unreadCount).toBe(1);
    act(() => {
      result.current.markAsRead();
    });
    expect(result.current.unreadCount).toBe(0);
  });

  it('should clear all messages', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.addMessage(mockMessage);
      result.current.addMessage({ ...mockMessage, id: '2' });
    });
    expect(result.current.messages.length).toBe(2);
    expect(result.current.unreadCount).toBe(2);
    act(() => {
      result.current.clearMessages();
    });
    expect(result.current.messages).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });
});
