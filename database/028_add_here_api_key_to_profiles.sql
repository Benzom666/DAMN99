-- Add HERE API key column to profiles for BYOK (Bring Your Own Key)
-- Allows super admin to assign individual HERE API keys to specific admins

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS here_api_key TEXT NULL;

COMMENT ON COLUMN public.profiles.here_api_key IS 'Optional HERE API key for this admin. If set, this admin uses their own key instead of the platform key.';

-- Add column to track which key was used in cost tracking
ALTER TABLE public.here_api_usage
ADD COLUMN IF NOT EXISTS used_own_key BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.here_api_usage.used_own_key IS 'True if admin used their own HERE API key, false if platform key was used.';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_here_api_usage_used_own_key ON public.here_api_usage(used_own_key);
