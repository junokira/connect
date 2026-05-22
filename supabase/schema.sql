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
  following_count integer not null default 0
);

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
begin
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
  if base_username = '' then
    base_username := 'user';
  end if;

  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', base_username),
    base_username || '_' || left(new.id::text, 5)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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

create or replace function public.increment_post_counter(target_post_id uuid, counter_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if counter_name = 'likes_count' then
    update public.posts set likes_count = likes_count + 1 where id = target_post_id;
  elsif counter_name = 'comments_count' then
    update public.posts set comments_count = comments_count + 1 where id = target_post_id;
  elsif counter_name = 'reposts_count' then
    update public.posts set reposts_count = reposts_count + 1 where id = target_post_id;
  elsif counter_name = 'bookmarks_count' then
    update public.posts set bookmarks_count = bookmarks_count + 1 where id = target_post_id;
  else
    raise exception 'Unsupported counter %', counter_name;
  end if;
end;
$$;
