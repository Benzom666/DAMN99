import type { Order, Route, Profile } from '@/lib/types';

export const mockOrder = (overrides?: Partial<Order>): Order => ({
  id: 'order-1',
  customer_name: 'Test Customer',
  customer_phone: '555-0100',
  delivery_address: '123 Test St',
  delivery_lat: 40.7128,
  delivery_lng: -74.0060,
  delivery_window_start: '09:00',
  delivery_window_end: '17:00',
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  organization_id: 'org-1',
  ...overrides,
});

export const mockRoute = (overrides?: Partial<Route>): Route => ({
  id: 'route-1',
  name: 'Test Route',
  driver_id: 'driver-1',
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  organization_id: 'org-1',
  ...overrides,
});

export const mockProfile = (overrides?: Partial<Profile>): Profile => ({
  id: 'user-1',
  email: 'test@example.com',
  role: 'admin',
  organization_id: 'org-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});
