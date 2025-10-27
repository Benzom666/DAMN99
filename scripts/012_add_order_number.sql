-- Add order_number column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Add comment
COMMENT ON COLUMN orders.order_number IS 'Unique order number for tracking. Can be provided via CSV or auto-generated.';
