-- Add github_username column to team_invitations
ALTER TABLE public.team_invitations 
ADD COLUMN github_username text;

-- Make email nullable since we can now invite by username
ALTER TABLE public.team_invitations 
ALTER COLUMN email DROP NOT NULL;

-- Add constraint to ensure either email or github_username is present
ALTER TABLE public.team_invitations 
ADD CONSTRAINT team_invitations_contact_check 
CHECK (email IS NOT NULL OR github_username IS NOT NULL);
