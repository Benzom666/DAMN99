-- Create pod_photos table for storing multiple photos per POD
CREATE TABLE IF NOT EXISTS pod_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pod_photos_pod_id ON pod_photos(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_photos_order ON pod_photos(pod_id, photo_order);

-- Add RLS policies
ALTER TABLE pod_photos ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read pod photos
CREATE POLICY "Allow authenticated users to read pod photos"
  ON pod_photos FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert pod photos
CREATE POLICY "Allow authenticated users to insert pod photos"
  ON pod_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to delete their pod photos
CREATE POLICY "Allow authenticated users to delete pod photos"
  ON pod_photos FOR DELETE
  TO authenticated
  USING (true);
