create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  username text not null unique,
  avatar_url text not null default 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
  banner_url text not null default 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=80',
  bio text not null default 'New to CONNECT.',
  location text not null default '',
  website text not null default '',
  created_at timestamptz not null default now(),
  followers_count integer not null default 0,
  following_count integer not null default 0,
  verified boolean not null default false
);

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'verified'
  ) then
    alter table public.profiles add column verified boolean not null default true;
    update public.profiles set verified = true;
  end if;
end $$;

alter table public.profiles
  alter column verified set default false;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('text', 'photo', 'video')),
  content text not null default '',
  caption text not null default '',
  image_url text,
  video_url text,
  thumbnail_url text,
  x integer not null default 0,
  y integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  reposts_count integer not null default 0,
  bookmarks_count integer not null default 0,
  hashtags text[] not null default '{}',
  pinned boolean not null default false
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('like', 'repost', 'bookmark')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, type)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create or replace function public.clean_connect_username(raw_username text)
returns text
language plpgsql
immutable
as $$
declare
  cleaned text;
begin
  cleaned := regexp_replace(coalesce(raw_username, ''), '^@+', '');
  cleaned := regexp_replace(cleaned, '[^a-zA-Z0-9_]', '_', 'g');
  cleaned := regexp_replace(cleaned, '_+', '_', 'g');
  cleaned := regexp_replace(cleaned, '^_+|_+$', '', 'g');
  cleaned := left(cleaned, 24);
  if cleaned = '' then
    cleaned := 'connectuser';
  end if;
  return cleaned;
end;
$$;

create or replace function public.available_connect_username(raw_username text, current_user_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  suffix integer := 0;
begin
  base_username := public.clean_connect_username(raw_username);

  loop
    candidate := case when suffix = 0 then base_username else base_username || suffix::text end;
    if not exists (
      select 1 from public.profiles
      where username = candidate and (current_user_id is null or id <> current_user_id)
    ) then
      return candidate;
    end if;
    suffix := suffix + 1;
    if suffix > 99 then
      raise exception 'Unable to find an available username';
    end if;
  end loop;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  requested_username text;
begin
  base_username := public.clean_connect_username(split_part(new.email, '@', 1));
  requested_username := public.available_connect_username(coalesce(nullif(new.raw_user_meta_data->>'username', ''), base_username), new.id);

  insert into public.profiles (id, display_name, username, avatar_url, banner_url, bio, location, website)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', base_username),
    requested_username,
    coalesce(nullif(new.raw_user_meta_data->>'avatar_url', ''), 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80'),
    coalesce(nullif(new.raw_user_meta_data->>'banner_url', ''), 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=80'),
    coalesce(nullif(new.raw_user_meta_data->>'bio', ''), 'New to CONNECT.'),
    coalesce(new.raw_user_meta_data->>'location', ''),
    coalesce(new.raw_user_meta_data->>'website', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.connect_email_registered(target_email text)
returns boolean
language sql
security definer
set search_path = auth, public
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(target_email))
  );
$$;

revoke execute on function public.connect_email_registered(text) from anon, authenticated;
grant execute on function public.connect_email_registered(text) to anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('connect-media', 'connect-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "connect media is public" on storage.objects;
create policy "connect media is public" on storage.objects
  for select using (bucket_id = 'connect-media');

drop policy if exists "users upload own connect media" on storage.objects;
create policy "users upload own connect media" on storage.objects
  for insert with check (bucket_id = 'connect-media' and auth.uid()::text = (storage.foldername(name))[1]);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.follows enable row level security;

drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable" on public.profiles for select using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "posts are readable" on public.posts;
create policy "posts are readable" on public.posts for select using (true);

drop policy if exists "users create own posts" on public.posts;
create policy "users create own posts" on public.posts for insert with check (auth.uid() = author_id);

drop policy if exists "authors update own posts" on public.posts;
create policy "authors update own posts" on public.posts for update using (auth.uid() = author_id);

drop policy if exists "comments are readable" on public.comments;
create policy "comments are readable" on public.comments for select using (true);

drop policy if exists "users create own comments" on public.comments;
create policy "users create own comments" on public.comments for insert with check (auth.uid() = author_id);

drop policy if exists "reactions are readable" on public.post_reactions;
create policy "reactions are readable" on public.post_reactions for select using (true);

drop policy if exists "users create own reactions" on public.post_reactions;
create policy "users create own reactions" on public.post_reactions for insert with check (auth.uid() = user_id);

drop policy if exists "users delete own reactions" on public.post_reactions;
create policy "users delete own reactions" on public.post_reactions for delete using (auth.uid() = user_id);

drop policy if exists "follows are readable" on public.follows;
create policy "follows are readable" on public.follows for select using (true);

drop policy if exists "users follow as self" on public.follows;
create policy "users follow as self" on public.follows for insert with check (auth.uid() = follower_id);

drop policy if exists "users unfollow as self" on public.follows;
create policy "users unfollow as self" on public.follows for delete using (auth.uid() = follower_id);

create or replace function public.adjust_post_counter(target_post_id uuid, counter_name text, amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
begin
  actor_id := auth.uid();
  if actor_id is null then
    raise exception 'Authentication required';
  end if;
  if amount not in (-1, 1) then
    raise exception 'Unsupported counter adjustment %', amount;
  end if;

  if counter_name = 'likes_count' then
    if amount = 1 and not exists (
      select 1 from public.post_reactions
      where post_id = target_post_id and user_id = actor_id and type = 'like'
    ) then
      raise exception 'A like reaction is required before incrementing likes_count';
    end if;
    update public.posts set likes_count = greatest(0, likes_count + amount) where id = target_post_id;
  elsif counter_name = 'comments_count' then
    if amount = -1 then
      raise exception 'Comments cannot be decremented through this function';
    end if;
    if not exists (
      select 1 from public.comments
      where post_id = target_post_id and author_id = actor_id
    ) then
      raise exception 'A comment is required before incrementing comments_count';
    end if;
    update public.posts set comments_count = comments_count + amount where id = target_post_id;
  elsif counter_name = 'reposts_count' then
    if amount = 1 and not exists (
      select 1 from public.post_reactions
      where post_id = target_post_id and user_id = actor_id and type = 'repost'
    ) then
      raise exception 'A repost reaction is required before incrementing reposts_count';
    end if;
    update public.posts set reposts_count = greatest(0, reposts_count + amount) where id = target_post_id;
  elsif counter_name = 'bookmarks_count' then
    if amount = 1 and not exists (
      select 1 from public.post_reactions
      where post_id = target_post_id and user_id = actor_id and type = 'bookmark'
    ) then
      raise exception 'A bookmark reaction is required before incrementing bookmarks_count';
    end if;
    update public.posts set bookmarks_count = greatest(0, bookmarks_count + amount) where id = target_post_id;
  else
    raise exception 'Unsupported counter %', counter_name;
  end if;
end;
$$;

create or replace function public.increment_post_counter(target_post_id uuid, counter_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.adjust_post_counter(target_post_id, counter_name, 1);
end;
$$;

revoke execute on function public.adjust_post_counter(uuid, text, integer) from anon;
grant execute on function public.adjust_post_counter(uuid, text, integer) to authenticated;
revoke execute on function public.increment_post_counter(uuid, text) from anon;
grant execute on function public.increment_post_counter(uuid, text) to authenticated;

create or replace function public.adjust_follow_counts(target_follower_id uuid, target_following_id uuid, amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
begin
  actor_id := auth.uid();
  if actor_id is null or actor_id <> target_follower_id then
    raise exception 'Authentication required';
  end if;
  if target_follower_id = target_following_id then
    raise exception 'Users cannot follow themselves';
  end if;
  if amount not in (-1, 1) then
    raise exception 'Unsupported follow adjustment %', amount;
  end if;
  if amount = 1 and not exists (
    select 1 from public.follows
    where follower_id = target_follower_id and following_id = target_following_id
  ) then
    raise exception 'A follow row is required before incrementing follow counts';
  end if;
  update public.profiles
  set following_count = greatest(0, following_count + amount)
  where id = target_follower_id;
  update public.profiles
  set followers_count = greatest(0, followers_count + amount)
  where id = target_following_id;
end;
$$;

revoke execute on function public.adjust_follow_counts(uuid, uuid, integer) from anon;
grant execute on function public.adjust_follow_counts(uuid, uuid, integer) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.posts;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.comments;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.post_reactions;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.follows;
exception when duplicate_object then null;
end $$;
