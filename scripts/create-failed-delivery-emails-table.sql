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

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read failed delivery emails"
  ON failed_delivery_emails
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert failed delivery emails"
  ON failed_delivery_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
