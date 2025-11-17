-- Create table for tracking HERE API usage and implementing daily caps

CREATE TABLE IF NOT EXISTS here_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_id UUID REFERENCES profiles(id),
  api_type TEXT NOT NULL, -- 'tour_planning', 'routing', 'geocoding'
  orders_count INTEGER, -- Number of orders in optimization request
  success BOOLEAN NOT NULL,
  error_message TEXT,
  response_time_ms INTEGER,
  metadata JSONB -- Store additional context like route_id, batch info, etc.
);

-- Index for fast daily usage lookups
CREATE INDEX IF NOT EXISTS idx_here_api_usage_created_at ON here_api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_here_api_usage_admin_id ON here_api_usage(admin_id);
CREATE INDEX IF NOT EXISTS idx_here_api_usage_api_type ON here_api_usage(api_type);

-- RLS policies
ALTER TABLE here_api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS admin_view_their_usage 
  ON here_api_usage FOR SELECT 
  USING (admin_id = auth.uid());

CREATE POLICY IF NOT EXISTS system_insert_usage 
  ON here_api_usage FOR INSERT 
  WITH CHECK (true);

COMMENT ON TABLE here_api_usage IS 'Tracks all HERE API calls for cost monitoring and daily caps';
