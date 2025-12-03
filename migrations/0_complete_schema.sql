-- Complete Database Schema for NPM Candidate Search
-- This file consolidates all previous migrations into a single source of truth.
-- It matches the schema structure provided by the user.

-- ==========================================
-- 1. Helper Functions (Must be created first)
-- ==========================================

-- Function to check team membership securely (avoids recursion)
create or replace function public.is_team_member(_team_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from team_members
    where team_id = _team_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;


-- ==========================================
-- 2. Tables & Core Structure
-- ==========================================

-- Profiles Table
create table if not exists profiles (
  id uuid NOT NULL,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) on delete cascade
);

-- Teams Table
create table if not exists teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  name text NOT NULL,
  created_by uuid,
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Team Members Table
create table if not exists team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  CONSTRAINT team_members_pkey PRIMARY KEY (id),
  CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) on delete cascade,
  CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) on delete cascade,
  unique(team_id, user_id)
);

-- Team Invitations Table
create table if not exists team_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  team_id uuid NOT NULL,
  email text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])),
  created_by uuid NOT NULL,
  CONSTRAINT team_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT team_invitations_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) on delete cascade,
  CONSTRAINT team_invitations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Saved Candidates Table
create table if not exists saved_candidates (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  package_name text NOT NULL,
  package_version text,
  description text,
  keywords text[],
  date text,
  npm_link text,
  repository_link text,
  homepage_link text,
  publisher_username text,
  publisher_email text,
  score_final double precision,
  score_quality double precision,
  score_popularity double precision,
  score_maintenance double precision,
  github_user_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  team_id uuid,
  status text DEFAULT 'new'::text CHECK (status = ANY (ARRAY['new'::text, 'contacted'::text, 'replied'::text, 'interviewing'::text, 'hired'::text, 'rejected'::text])),
  CONSTRAINT saved_candidates_pkey PRIMARY KEY (id),
  CONSTRAINT saved_candidates_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) on delete cascade,
  CONSTRAINT saved_candidates_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) on delete cascade,
  unique(team_id, package_name)
);

-- Candidate Notes Table
create table if not exists candidate_notes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  saved_candidate_id bigint NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT candidate_notes_pkey PRIMARY KEY (id),
  CONSTRAINT candidate_notes_saved_candidate_id_fkey FOREIGN KEY (saved_candidate_id) REFERENCES public.saved_candidates(id) on delete cascade,
  CONSTRAINT candidate_notes_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) on delete cascade
);


-- ==========================================
-- 3. Row Level Security (RLS) & Policies
-- ==========================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table team_invitations enable row level security;
alter table saved_candidates enable row level security;
alter table candidate_notes enable row level security;

-- --- Profiles Policies ---
create policy "Users can view profiles of team members"
  on profiles for select
  using (
    auth.uid() = id -- Own profile
    or 
    exists ( -- Same team
      select 1 from team_members tm_me
      join team_members tm_other on tm_me.team_id = tm_other.team_id
      where tm_me.user_id = auth.uid()
      and tm_other.user_id = profiles.id
    )
    or
    exists ( -- Pending invitation
       select 1 from team_invitations
       where team_invitations.email = profiles.email
    )
  );

-- --- Teams Policies ---
create policy "Users can view their teams"
  on teams for select
  using (
    auth.uid() = created_by
    or 
    public.is_team_member(id)
  );

create policy "Users can create teams"
  on teams for insert
  to authenticated
  with check (true);

-- --- Team Members Policies ---
create policy "Users can view team members"
  on team_members for select
  using (
    auth.uid() = user_id
    or
    public.is_team_member(team_id)
  );

create policy "Users can join teams"
  on team_members for insert
  with check (auth.uid() = user_id);

create policy "Team creators can remove members"
  on team_members for delete
  using (
    exists (
      select 1 from teams
      where teams.id = team_members.team_id
      and teams.created_by = auth.uid()
    )
    or
    auth.uid() = user_id -- Can always remove self (leave)
  );

-- --- Team Invitations Policies ---
create policy "Users can view their own invitations"
  on team_invitations for select
  using ( email = auth.jwt() ->> 'email' );

create policy "Team members can view sent invitations"
  on team_invitations for select
  using ( public.is_team_member(team_id) );

create policy "Team members can create invitations"
  on team_invitations for insert
  with check ( public.is_team_member(team_id) );

create policy "Users can update their own invitations"
  on team_invitations for update
  using ( email = auth.jwt() ->> 'email' );

-- --- Saved Candidates Policies ---
create policy "Users can view saved candidates"
  on saved_candidates for select
  using (
    auth.uid() = user_id -- Own
    or
    (team_id is not null and public.is_team_member(team_id)) -- Team member
  );

create policy "Users can insert saved candidates"
  on saved_candidates for insert
  with check (
    auth.uid() = user_id
    and
    (
      team_id is null -- Personal
      or
      public.is_team_member(team_id) -- Member of the team
    )
  );

create policy "Users can update saved candidates"
  on saved_candidates for update
  using (
    auth.uid() = user_id -- Own
    or
    (team_id is not null and public.is_team_member(team_id)) -- Team member
  );

create policy "Users can delete saved candidates"
  on saved_candidates for delete
  using (
    auth.uid() = user_id -- Own
    or
    (team_id is not null and public.is_team_member(team_id)) -- Team member
  );

-- --- Candidate Notes Policies ---
create policy "Users can view notes"
  on candidate_notes for select
  using (
    exists (
      select 1 from saved_candidates sc
      where sc.id = candidate_notes.saved_candidate_id
      and (
        sc.user_id = auth.uid()
        or
        (sc.team_id is not null and public.is_team_member(sc.team_id))
      )
    )
  );

create policy "Users can insert notes"
  on candidate_notes for insert
  with check (
    auth.uid() = user_id
    and
    exists (
      select 1 from saved_candidates sc
      where sc.id = candidate_notes.saved_candidate_id
      and (
        sc.user_id = auth.uid()
        or
        (sc.team_id is not null and public.is_team_member(sc.team_id))
      )
    )
  );

create policy "Users can delete own notes"
  on candidate_notes for delete
  using (auth.uid() = user_id);


-- ==========================================
-- 4. Triggers & Data Integrity
-- ==========================================

-- Trigger for new user profile creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for existing users (safe to run multiple times)
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- Grant permissions
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
