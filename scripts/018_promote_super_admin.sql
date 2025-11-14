-- Promote benzom59@gmail.com to super_admin role
-- Run this script ONCE to make your account a super admin

-- First, verify the account exists
DO $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'benzom59@gmail.com';
BEGIN
  -- Find the user ID for the super admin email
  SELECT id INTO admin_user_id
  FROM profiles
  WHERE email = admin_email;

  -- Check if user exists
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found. Please create an account first.', admin_email;
  ELSE
    -- Update the user to super_admin role
    UPDATE profiles
    SET user_role = 'super_admin',
        updated_at = now()
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Successfully promoted % to super_admin!', admin_email;
    RAISE NOTICE 'User ID: %', admin_user_id;
  END IF;
END $$;

-- Verify the change
SELECT 
  id,
  email,
  full_name,
  user_role,
  created_at,
  updated_at
FROM profiles
WHERE email = 'benzom59@gmail.com';
