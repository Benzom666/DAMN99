-- ============================================================================
-- MIGRATION 012: POD PHOTOS TABLE (MULTI-PHOTO SUPPORT)
-- ============================================================================
-- This migration adds support for multiple photos per POD
-- Run this after the base setup to enable multi-photo uploads
-- ============================================================================

-- Create pod_photos table for storing multiple photos per POD
CREATE TABLE IF NOT EXISTS public.pod_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_order INTEGER NOT NULL DEFAULT 1,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pod_photos_order_check CHECK (photo_order >= 1 AND photo_order <= 4)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pod_photos_pod_id ON public.pod_photos(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_photos_order ON public.pod_photos(pod_id, photo_order);

-- Enable RLS
ALTER TABLE public.pod_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
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

-- RLS Policies
CREATE POLICY "Drivers can view their own POD photos"
  ON public.pod_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pods
      WHERE pods.id = pod_photos.pod_id
      AND pods.driver_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can insert POD photos for their orders"
  ON public.pod_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pods
      WHERE pods.id = pod_photos.pod_id
      AND pods.driver_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all POD photos"
  ON public.pod_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comment for documentation
COMMENT ON TABLE public.pod_photos IS 'Stores multiple photos per POD for comprehensive delivery documentation';
COMMENT ON COLUMN public.pod_photos.photo_order IS 'Order of photo in the sequence (1-4)';
