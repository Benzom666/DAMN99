import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/geocode/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/security/authorization', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ user: { id: 'admin-1' }, profile: { role: 'admin' } }),
}));

vi.mock('@/lib/security/rate-limiter', () => ({
  rateLimit: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  }),
}));

vi.mock('@/lib/ensure-coords', () => ({
  ensureOrderCoordinates: vi.fn().mockResolvedValue({ orders: [], failed: [] }),
}));

describe('Geocode API', () => {
  it('rejects empty orderIds array', async () => {
    const req = new NextRequest('http://localhost:3000/api/geocode', {
      method: 'POST',
      body: JSON.stringify({ orderIds: [] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('orderIds array required');
  });

  it('rejects more than 100 orders', async () => {
    const req = new NextRequest('http://localhost:3000/api/geocode', {
      method: 'POST',
      body: JSON.stringify({ orderIds: Array(101).fill('order-id') }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Maximum 100 orders');
  });
});
