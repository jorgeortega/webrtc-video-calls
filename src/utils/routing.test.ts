import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateMeetingId,
  parseRoute,
  navigateTo,
  navigateToHome,
  navigateToMeeting,
  getMeetingUrl,
  generatePeerId,
} from './routing';

describe('routing utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMeetingId', () => {
    it('generates a meeting ID in the correct format', () => {
      const id = generateMeetingId();
      expect(id).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/);
    });

    it('generates unique IDs', () => {
      const id1 = generateMeetingId();
      const id2 = generateMeetingId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('parseRoute', () => {
    it('returns home view for empty hash', () => {
      // @ts-ignore
      delete window.location;
      // @ts-ignore
      window.location = { hash: '' };
      expect(parseRoute()).toEqual({ view: 'home' });
    });

    it('returns home view for root hash', () => {
      // @ts-ignore
      window.location.hash = '#/';
      expect(parseRoute()).toEqual({ view: 'home' });
    });

    it('returns meeting view with meetingId', () => {
      // @ts-ignore
      window.location.hash = '#/meeting/test-id';
      expect(parseRoute()).toEqual({ view: 'meeting', meetingId: 'test-id' });
    });

    it('returns home view for invalid hash', () => {
      // @ts-ignore
      window.location.hash = '#/invalid';
      expect(parseRoute()).toEqual({ view: 'home' });
    });
  });

  describe('navigateTo', () => {
    it('sets the window location hash', () => {
      // @ts-ignore
      delete window.location;
      // @ts-ignore
      window.location = { hash: '' };
      navigateTo('/test');
      expect(window.location.hash).toBe('/test');
    });
  });

  describe('navigateToHome', () => {
    it('navigates to /', () => {
      // @ts-ignore
      window.location.hash = '';
      navigateToHome();
      expect(window.location.hash).toBe('/');
    });
  });

  describe('navigateToMeeting', () => {
    it('navigates to the meeting route', () => {
      // @ts-ignore
      window.location.hash = '';
      navigateToMeeting('test-id');
      expect(window.location.hash).toBe('/meeting/test-id');
    });
  });

  describe('getMeetingUrl', () => {
    it('returns the full meeting URL', () => {
      // @ts-ignore
      window.location.origin = 'http://localhost:3000';
      // @ts-ignore
      window.location.pathname = '/';
      const url = getMeetingUrl('test-id');
      expect(url).toBe('http://localhost:3000/#/meeting/test-id');
    });
  });

  describe('generatePeerId', () => {
    it('generates a random string', () => {
      const id = generatePeerId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(5);
    });
  });
});
