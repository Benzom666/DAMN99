import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canAccessOrder } from '@/lib/security/authorization';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

describe('Authorization', () => {
  describe('canAccessOrder', () => {
    it('allows admin to access any order', async () => {
      const result = await canAccessOrder('order-1', 'user-1', 'admin');
      expect(result).toBe(true);
    });

    it('allows super_admin to access any order', async () => {
      const result = await canAccessOrder('order-1', 'user-1', 'super_admin');
      expect(result).toBe(true);
    });

    it('denies access for unknown role', async () => {
      const result = await canAccessOrder('order-1', 'user-1', 'unknown');
      expect(result).toBe(false);
    });
  });
});
