-- ============================================================================
-- MIGRATION 013: FAILED DELIVERY EMAILS TABLE
-- ============================================================================
-- This migration adds tracking for failed delivery email notifications
-- Run this after the base setup to enable failed delivery email tracking
-- ============================================================================

-- Create table for tracking failed delivery email notifications
CREATE TABLE IF NOT EXISTS public.failed_delivery_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  provider_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_failed_delivery_emails_order_id ON public.failed_delivery_emails(order_id);

-- Enable RLS
ALTER TABLE public.failed_delivery_emails ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
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

-- RLS Policies
CREATE POLICY "Allow authenticated users to read failed delivery emails"
  ON public.failed_delivery_emails
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Allow authenticated users to insert failed delivery emails"
  ON public.failed_delivery_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Add comments for documentation
COMMENT ON TABLE public.failed_delivery_emails IS 'Tracks failed delivery email notifications to prevent duplicates';
COMMENT ON COLUMN public.failed_delivery_emails.provider_message_id IS 'SendGrid message ID for tracking';
