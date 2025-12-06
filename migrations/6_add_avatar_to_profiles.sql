-- Add avatar_url and full_name columns to profiles table
alter table profiles 
add column if not exists avatar_url text,
add column if not exists full_name text;

-- Update the handle_new_user function to verify metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, avatar_url, full_name)
  values (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Backfill existing profiles from auth.users
update profiles
set 
  avatar_url = users.raw_user_meta_data->>'avatar_url',
  full_name = coalesce(users.raw_user_meta_data->>'full_name', users.raw_user_meta_data->>'name')
from auth.users
where profiles.id = users.id;
