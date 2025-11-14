-- Add location fields to pods table to capture driver's GPS position at delivery/failure time
ALTER TABLE pods 
ADD COLUMN IF NOT EXISTS delivery_latitude numeric,
ADD COLUMN IF NOT EXISTS delivery_longitude numeric,
ADD COLUMN IF NOT EXISTS delivery_accuracy numeric;

-- Add comment to document the new columns
COMMENT ON COLUMN pods.delivery_latitude IS 'GPS latitude coordinate where delivery was completed';
COMMENT ON COLUMN pods.delivery_longitude IS 'GPS longitude coordinate where delivery was completed';
COMMENT ON COLUMN pods.delivery_accuracy IS 'GPS accuracy in meters at time of delivery';
