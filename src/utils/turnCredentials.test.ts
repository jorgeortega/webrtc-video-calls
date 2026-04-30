import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { fetchTurnCredentials } from './turnCredentials';

describe('turnCredentials utils', () => {
  const originalFetch = window.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    window.fetch = vi.fn();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    window.fetch = originalFetch;
  });

  it('returns STUN only if domain or apiKey is missing', async () => {
    const result = await fetchTurnCredentials('', '');
    expect(result).toEqual([{ urls: 'stun:stun.metered.ca:80' }]);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('not configured'));
  });

  it('fetches TURN credentials successfully', async () => {
    const mockIceServers = [{ urls: 'turn:test.metered.ca' }];
    (window.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockIceServers),
    });

    const result = await fetchTurnCredentials('test.metered.ca', 'test-key');
    expect(result).toEqual(mockIceServers);
    expect(window.fetch).toHaveBeenCalledWith(
      'https://test.metered.ca/api/v1/turn/credentials?apiKey=test-key'
    );
  });

  it('returns STUN fallback if response is not ok', async () => {
    (window.fetch as any).mockResolvedValue({
      ok: false,
    });

    const result = await fetchTurnCredentials('test.metered.ca', 'test-key');
    expect(result).toEqual([{ urls: 'stun:stun.metered.ca:80' }]);
    expect(console.error).toHaveBeenCalled();
  });

  it('returns STUN fallback if fetch throws', async () => {
    (window.fetch as any).mockRejectedValue(new Error('Network error'));

    const result = await fetchTurnCredentials('test.metered.ca', 'test-key');
    expect(result).toEqual([{ urls: 'stun:stun.metered.ca:80' }]);
    expect(console.error).toHaveBeenCalled();
  });
});
