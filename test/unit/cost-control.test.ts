import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

// Import after mocking
const { normalizeAddressKey } = await import('@/lib/here/cost-control');

describe('HERE API Cost Control', () => {
  describe('normalizeAddressKey', () => {
    it('converts to lowercase', () => {
      expect(normalizeAddressKey(['123 Main St'])).toBe('123 main st');
    });

    it('removes extra whitespace', () => {
      expect(normalizeAddressKey(['123  Main   St'])).toBe('123 main st');
    });

    it('joins multiple parts', () => {
      expect(normalizeAddressKey(['123 Main St', 'New York', 'NY'])).toBe('123 main st, new york, ny');
    });

    it('handles empty array', () => {
      expect(normalizeAddressKey([])).toBe('');
    });

    it('filters null and undefined', () => {
      expect(normalizeAddressKey(['123 Main St', null, undefined, 'NY'])).toBe('123 main st, ny');
    });
  });
});
