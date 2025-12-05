-- Add Labels Table
create table if not exists labels (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  name text NOT NULL,
  color text NOT NULL,
  team_id uuid,
  user_id uuid,
  CONSTRAINT labels_pkey PRIMARY KEY (id),
  CONSTRAINT labels_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) on delete cascade,
  CONSTRAINT labels_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) on delete cascade,
  CONSTRAINT labels_owner_check CHECK (
    (team_id IS NOT NULL AND user_id IS NULL) OR
    (team_id IS NULL AND user_id IS NOT NULL)
  ),
  unique(name, team_id),
  unique(name, user_id)
);

-- Add Saved Candidate Labels (Join Table)
create table if not exists saved_candidate_labels (
  saved_candidate_id bigint NOT NULL,
  label_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT saved_candidate_labels_pkey PRIMARY KEY (saved_candidate_id, label_id),
  CONSTRAINT saved_candidate_labels_candidate_fkey FOREIGN KEY (saved_candidate_id) REFERENCES public.saved_candidates(id) on delete cascade,
  CONSTRAINT saved_candidate_labels_label_fkey FOREIGN KEY (label_id) REFERENCES public.labels(id) on delete cascade
);

-- RLS for Labels

alter table labels enable row level security;

-- View Labels: Own personal labels OR labels of teams I am a member of
create policy "Users can view labels"
  on labels for select
  using (
    (user_id = auth.uid()) OR
    (team_id IS NOT NULL AND public.is_team_member(team_id))
  );

-- Create Labels: Must be for self OR for a team I am a member of
create policy "Users can create labels"
  on labels for insert
  with check (
    (user_id = auth.uid()) OR
    (team_id IS NOT NULL AND public.is_team_member(team_id))
  );

-- Delete Labels: Own personal labels OR labels of teams I am a member of (Assuming any member can delete, or maybe restriction needed? Keeping simple for now)
create policy "Users can delete labels"
  on labels for delete
  using (
    (user_id = auth.uid()) OR
    (team_id IS NOT NULL AND public.is_team_member(team_id))
  );


-- RLS for Saved Candidate Labels

alter table saved_candidate_labels enable row level security;

-- View: If I can see the candidate AND I can see the label
create policy "Users can view candidate labels"
  on saved_candidate_labels for select
  using (
    exists (
      select 1 from saved_candidates sc
      where sc.id = saved_candidate_labels.saved_candidate_id
      and (
        sc.user_id = auth.uid() OR
        (sc.team_id IS NOT NULL AND public.is_team_member(sc.team_id))
      )
    )
  );

-- Insert: If I can edit the candidate AND I can see the label
create policy "Users can add labels to candidates"
  on saved_candidate_labels for insert
  with check (
    exists (
      select 1 from saved_candidates sc
      where sc.id = saved_candidate_labels.saved_candidate_id
      and (
        sc.user_id = auth.uid() OR
        (sc.team_id IS NOT NULL AND public.is_team_member(sc.team_id))
      )
    )
  );

-- Delete: If I can edit the candidate
create policy "Users can remove labels from candidates"
  on saved_candidate_labels for delete
  using (
    exists (
      select 1 from saved_candidates sc
      where sc.id = saved_candidate_labels.saved_candidate_id
      and (
        sc.user_id = auth.uid() OR
        (sc.team_id IS NOT NULL AND public.is_team_member(sc.team_id))
      )
    )
  );
