-- Add captain role to the enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'captain';

-- Add PostgreSQL function to allow captains to delete users completely
CREATE OR REPLACE FUNCTION public.delete_user_by_captain(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Verify the caller is a captain
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'captain'
  ) THEN
    RAISE EXCEPTION 'Only captains can delete users';
  END IF;

  DELETE FROM public.users WHERE auth_user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add PostgreSQL function to allow captains to update user roles
CREATE OR REPLACE FUNCTION public.update_user_role_by_captain(target_user_id UUID, new_role user_role)
RETURNS void AS $$
BEGIN
  -- Verify the caller is a captain
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'captain'
  ) THEN
    RAISE EXCEPTION 'Only captains can update user roles';
  END IF;

  UPDATE public.users SET role = new_role WHERE auth_user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
