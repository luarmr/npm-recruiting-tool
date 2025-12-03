-- Force fix constraints to ensure exactly one relationship to profiles
-- We will use the standard naming convention and remove all others to avoid ambiguity.

-- 1. Saved Candidates
-- Drop ALL potential variations of the constraint
alter table saved_candidates drop constraint if exists saved_candidates_user_id_fkey;
alter table saved_candidates drop constraint if exists saved_candidates_user_id_fkey_profiles;
alter table saved_candidates drop constraint if exists saved_candidates_user_id_profiles_fkey;

-- Add the single definitive FK to profiles with the standard name
alter table saved_candidates 
add constraint saved_candidates_user_id_fkey 
foreign key (user_id) references profiles(id)
on delete cascade;


-- 2. Candidate Notes
-- Drop ALL potential variations of the constraint
alter table candidate_notes drop constraint if exists candidate_notes_user_id_fkey;
alter table candidate_notes drop constraint if exists candidate_notes_user_id_fkey_profiles;
alter table candidate_notes drop constraint if exists candidate_notes_user_id_profiles_fkey;

-- Add the single definitive FK to profiles with the standard name
alter table candidate_notes 
add constraint candidate_notes_user_id_fkey 
foreign key (user_id) references profiles(id)
on delete cascade;

-- 3. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload config';
