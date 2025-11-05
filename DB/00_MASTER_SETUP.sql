-- ============================================================================
-- DELIVERY MANAGEMENT APP - MASTER DATABASE SETUP
-- ============================================================================
-- This script sets up the complete database schema for the delivery management
-- application. It can be run multiple times safely (idempotent).
--
-- Execute this entire file in the Supabase SQL Editor to set up your database.
-- ============================================================================

-- ============================================================================
-- SCRIPT 001: CREATE CORE TABLES
-- ============================================================================

-- Create profiles table with role-based access
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create routes table (must be created before orders due to foreign key)
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  total_stops INTEGER DEFAULT 0,
  completed_stops INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  notes TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_transit', 'delivered', 'failed')),
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  stop_sequence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pods (proof of delivery) table
CREATE TABLE IF NOT EXISTS public.pods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT,
  signature_url TEXT,
  notes TEXT,
  recipient_name TEXT,
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stop_events table for tracking delivery attempts
CREATE TABLE IF NOT EXISTS public.stop_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('arrived', 'delivered', 'failed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_route_id ON public.orders(route_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_routes_driver_id ON public.routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON public.routes(status);
CREATE INDEX IF NOT EXISTS idx_pods_order_id ON public.pods(order_id);
CREATE INDEX IF NOT EXISTS idx_stop_events_order_id ON public.stop_events(order_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_routes_updated_at ON public.routes;
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON public.routes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SCRIPT 002: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stop_events ENABLE ROW LEVEL SECURITY;

-- Create security definer function to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$ 
  SELECT role FROM public.profiles WHERE id = auth.uid(); 
$$;

-- Revoke public access to the function
REVOKE ALL ON FUNCTION public.get_user_role() FROM public;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- Drop all existing policies to avoid conflicts
DO $$ 
DECLARE 
  r RECORD; 
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies 
    WHERE schemaname='public' AND tablename IN ('profiles','orders','routes','pods','stop_events')
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename); 
  END LOOP;
END $$;

-- Profiles policies - simplified, no recursion
CREATE POLICY "profiles_select_self"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Orders policies - use security definer function
CREATE POLICY "orders_select"
  ON public.orders FOR SELECT
  USING ( public.get_user_role() = 'admin' OR 
          EXISTS (SELECT 1 FROM public.routes WHERE id = orders.route_id AND driver_id = auth.uid()) );

CREATE POLICY "orders_insert"
  ON public.orders FOR INSERT
  WITH CHECK ( public.get_user_role() = 'admin' );

CREATE POLICY "orders_update"
  ON public.orders FOR UPDATE
  USING ( public.get_user_role() = 'admin' OR 
          EXISTS (SELECT 1 FROM public.routes WHERE id = orders.route_id AND driver_id = auth.uid()) );

CREATE POLICY "orders_delete"
  ON public.orders FOR DELETE
  USING ( public.get_user_role() = 'admin' );

-- Routes policies - use security definer function
CREATE POLICY "routes_select"
  ON public.routes FOR SELECT
  USING ( public.get_user_role() = 'admin' OR driver_id = auth.uid() );

CREATE POLICY "routes_insert"
  ON public.routes FOR INSERT
  WITH CHECK ( public.get_user_role() = 'admin' );

CREATE POLICY "routes_update"
  ON public.routes FOR UPDATE
  USING ( public.get_user_role() = 'admin' OR driver_id = auth.uid() );

CREATE POLICY "routes_delete"
  ON public.routes FOR DELETE
  USING ( public.get_user_role() = 'admin' );

-- PODs policies - use security definer function
CREATE POLICY "pods_select"
  ON public.pods FOR SELECT
  USING ( public.get_user_role() = 'admin' OR driver_id = auth.uid() );

CREATE POLICY "pods_insert"
  ON public.pods FOR INSERT
  WITH CHECK ( driver_id = auth.uid() );

-- Stop events policies - use security definer function
CREATE POLICY "stop_events_select"
  ON public.stop_events FOR SELECT
  USING ( public.get_user_role() = 'admin' OR driver_id = auth.uid() );

CREATE POLICY "stop_events_insert"
  ON public.stop_events FOR INSERT
  WITH CHECK ( driver_id = auth.uid() );

-- ============================================================================
-- SCRIPT 003: CREATE PROFILE TRIGGER
-- ============================================================================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'driver'),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SCRIPT 004: ADD GEOCODING COLUMNS
-- ============================================================================

-- Add geocoding metadata columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS geocode_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS geocode_label TEXT,
  ADD COLUMN IF NOT EXISTS geocode_status TEXT,
  ADD COLUMN IF NOT EXISTS geocode_error TEXT;

-- Add indexes for geocoding status queries
CREATE INDEX IF NOT EXISTS idx_orders_geocode_status ON public.orders(geocode_status);
CREATE INDEX IF NOT EXISTS idx_orders_geocode_error ON public.orders(geocode_error) WHERE geocode_error IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_coordinates ON public.orders(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- SCRIPT 005: ADD VRP FIELDS
-- ============================================================================

-- Driver/vehicle fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vehicle_capacity INT,
  ADD COLUMN IF NOT EXISTS shift_start TIME,
  ADD COLUMN IF NOT EXISTS shift_end TIME,
  ADD COLUMN IF NOT EXISTS depot_lat NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS depot_lng NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS driver_skills TEXT[];

-- Order fields for time windows, service time, skills, and quantity
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tw_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tw_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS service_seconds INT,
  ADD COLUMN IF NOT EXISTS service_minutes INT,
  ADD COLUMN IF NOT EXISTS required_skills TEXT[],
  ADD COLUMN IF NOT EXISTS quantity INT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_tw_start ON public.orders(tw_start);
CREATE INDEX IF NOT EXISTS idx_orders_tw_end ON public.orders(tw_end);
CREATE INDEX IF NOT EXISTS idx_profiles_shift ON public.profiles(shift_start, shift_end);

-- ============================================================================
-- SCRIPT 006: ADD GLOBAL ROUTING FIELDS
-- ============================================================================

-- Add address fields to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS full_address TEXT,
ADD COLUMN IF NOT EXISTS state_province TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Add route optimization fields to routes
ALTER TABLE public.routes
ADD COLUMN IF NOT EXISTS total_distance_m INTEGER,
ADD COLUMN IF NOT EXISTS total_duration_s INTEGER,
ADD COLUMN IF NOT EXISTS vehicle_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS depot_lat NUMERIC,
ADD COLUMN IF NOT EXISTS depot_lng NUMERIC,
ADD COLUMN IF NOT EXISTS raw_solution_json JSONB;

-- Create route_stops table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  eta TIMESTAMP WITH TIME ZONE,
  etd TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON public.route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_order_id ON public.route_stops(order_id);

-- Enable RLS on route_stops
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE 
  r RECORD; 
BEGIN
  FOR r IN SELECT policyname FROM pg_policies 
    WHERE schemaname='public' AND tablename='route_stops'
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.route_stops', r.policyname); 
  END LOOP;
END $$;

-- RLS policies for route_stops
CREATE POLICY "Admins can manage route_stops"
  ON public.route_stops
  FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Drivers can view their route_stops"
  ON public.route_stops
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.routes
      WHERE routes.id = route_stops.route_id
      AND routes.driver_id = auth.uid()
    )
  );

-- ============================================================================
-- SCRIPT 007: CREATE DRIVER POSITIONS
-- ============================================================================

-- Create driver_positions table for live tracking
CREATE TABLE IF NOT EXISTS public.driver_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_driver_positions_driver_id ON public.driver_positions(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_positions_updated_at ON public.driver_positions(updated_at);

-- Enable RLS
ALTER TABLE public.driver_positions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE 
  r RECORD; 
BEGIN
  FOR r IN SELECT policyname FROM pg_policies 
    WHERE schemaname='public' AND tablename='driver_positions'
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.driver_positions', r.policyname); 
  END LOOP;
END $$;

-- Policies for driver_positions
CREATE POLICY "driver_positions_select"
  ON public.driver_positions FOR SELECT
  USING ( public.get_user_role() = 'admin' OR driver_id = auth.uid() );

CREATE POLICY "driver_positions_insert"
  ON public.driver_positions FOR INSERT
  WITH CHECK ( driver_id = auth.uid() );

CREATE POLICY "driver_positions_update"
  ON public.driver_positions FOR UPDATE
  USING ( driver_id = auth.uid() );

-- Create function to upsert driver position
CREATE OR REPLACE FUNCTION public.upsert_driver_position(
  p_driver_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_accuracy DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.driver_positions (driver_id, lat, lng, accuracy, updated_at)
  VALUES (p_driver_id, p_lat, p_lng, p_accuracy, NOW())
  ON CONFLICT (driver_id)
  DO UPDATE SET
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    accuracy = EXCLUDED.accuracy,
    updated_at = NOW();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.upsert_driver_position TO authenticated;

-- ============================================================================
-- SCRIPT 009: ADD ROUTE METRICS
-- ============================================================================

-- Add route metrics columns (idempotent)
ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS distance_km DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS duration_sec INTEGER,
  ADD COLUMN IF NOT EXISTS drive_time_sec INTEGER,
  ADD COLUMN IF NOT EXISTS service_time_sec INTEGER,
  ADD COLUMN IF NOT EXISTS metrics_updated_at TIMESTAMPTZ;

-- Create index for faster metrics queries
CREATE INDEX IF NOT EXISTS idx_routes_metrics_updated_at ON routes(metrics_updated_at);

-- Add comments for documentation
COMMENT ON COLUMN routes.distance_km IS 'Total route distance in kilometers';
COMMENT ON COLUMN routes.duration_sec IS 'Total route duration in seconds (drive + service time)';
COMMENT ON COLUMN routes.drive_time_sec IS 'Total driving time in seconds';
COMMENT ON COLUMN routes.service_time_sec IS 'Total service time in seconds';
COMMENT ON COLUMN routes.metrics_updated_at IS 'Last time metrics were calculated';

-- ============================================================================
-- SCRIPT 010: POD EMAILS IDEMPOTENCY
-- ============================================================================

-- Create pod_emails table for idempotency tracking
CREATE TABLE IF NOT EXISTS public.pod_emails (
  pod_id UUID PRIMARY KEY REFERENCES public.pods(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider_message_id TEXT
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pod_emails_order_id ON public.pod_emails(order_id);
CREATE INDEX IF NOT EXISTS idx_pod_emails_sent_at ON public.pod_emails(sent_at DESC);

-- RLS policies
ALTER TABLE public.pod_emails ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE 
  r RECORD; 
BEGIN
  FOR r IN SELECT policyname FROM pg_policies 
    WHERE schemaname='public' AND tablename='pod_emails'
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.pod_emails', r.policyname); 
  END LOOP;
END $$;

-- Admins can read all email logs
CREATE POLICY "admin_read_pod_emails"
ON public.pod_emails FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

-- Drivers can read emails for their own deliveries
CREATE POLICY "driver_read_own_pod_emails"
ON public.pod_emails FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pods
    WHERE pods.id = pod_emails.pod_id
      AND pods.driver_id = auth.uid()
  )
);

-- Only server can insert (via service role)
CREATE POLICY "service_insert_pod_emails"
ON public.pod_emails FOR INSERT TO authenticated
WITH CHECK (FALSE);

-- ============================================================================
-- SCRIPT 011: REQUIRE CUSTOMER EMAIL
-- ============================================================================

-- Clean up any empty strings
UPDATE public.orders SET customer_email = NULL WHERE customer_email = '';

-- Add email format validation constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_email' 
    AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT valid_email
      CHECK (customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);

-- ============================================================================
-- SCRIPT 012: ADD ORDER NUMBER
-- ============================================================================

-- Add order_number column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Add comment
COMMENT ON COLUMN orders.order_number IS 'Unique order number for tracking. Can be provided via CSV or auto-generated.';

-- ============================================================================
-- SCRIPT 013: ADD DRIVER ACTIVE STATUS
-- ============================================================================

-- Add is_active column to profiles table for driver availability
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Set all existing drivers to active by default
UPDATE profiles SET is_active = TRUE WHERE role = 'driver' AND is_active IS NULL;

-- Add comment
COMMENT ON COLUMN profiles.is_active IS 'Whether the driver is active and available for route assignment';

-- ============================================================================
-- SCRIPT 014: ADD MULTI TENANCY
-- ============================================================================

-- Add admin_id column to all relevant tables for multi-tenancy
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES profiles(id);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES profiles(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_admin_id ON orders(admin_id);
CREATE INDEX IF NOT EXISTS idx_routes_admin_id ON routes(admin_id);
CREATE INDEX IF NOT EXISTS idx_profiles_admin_id ON profiles(admin_id);

-- ============================================================================
-- SCRIPT 017: POD PHOTOS TABLE
-- ============================================================================

-- Create pod_photos table for storing multiple photos per delivery
CREATE TABLE IF NOT EXISTS public.pod_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_order INTEGER NOT NULL DEFAULT 1,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pod_photos_order_check CHECK (photo_order >= 1 AND photo_order <= 4)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pod_photos_pod_id ON public.pod_photos(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_photos_order ON public.pod_photos(pod_id, photo_order);

-- Enable RLS
ALTER TABLE public.pod_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE 
  r RECORD; 
BEGIN
  FOR r IN SELECT policyname FROM pg_policies 
    WHERE schemaname='public' AND tablename='pod_photos'
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.pod_photos', r.policyname); 
  END LOOP;
END $$;

-- Drivers can view photos for their own PODs
CREATE POLICY "Drivers can view their own POD photos"
  ON public.pod_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pods
      WHERE pods.id = pod_photos.pod_id
      AND pods.driver_id = auth.uid()
    )
  );

-- Drivers can insert photos for their own PODs
CREATE POLICY "Drivers can insert POD photos for their orders"
  ON public.pod_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pods
      WHERE pods.id = pod_photos.pod_id
      AND pods.driver_id = auth.uid()
    )
  );

-- Admins can view all POD photos
CREATE POLICY "Admins can view all POD photos"
  ON public.pod_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- SCRIPT 018: FAILED DELIVERY EMAILS
-- ============================================================================

-- Create table for tracking failed delivery email notifications
CREATE TABLE IF NOT EXISTS failed_delivery_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  provider_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_failed_delivery_emails_order_id ON failed_delivery_emails(order_id);

-- Enable RLS
ALTER TABLE failed_delivery_emails ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE 
  r RECORD; 
BEGIN
  FOR r IN SELECT policyname FROM pg_policies 
    WHERE schemaname='public' AND tablename='failed_delivery_emails'
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.failed_delivery_emails', r.policyname); 
  END LOOP;
END $$;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read failed delivery emails"
  ON failed_delivery_emails
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert failed delivery emails"
  ON failed_delivery_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- All tables, indexes, triggers, and RLS policies have been created.
-- You can now use the application!
-- ============================================================================
