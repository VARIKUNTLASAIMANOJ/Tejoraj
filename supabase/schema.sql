-- SpaceAgent Supabase schema
-- Run this in the Supabase SQL editor after creating your project.
-- Enable email confirmations in Supabase Auth to make signup send a verification email.

create extension if not exists pgcrypto;

create table if not exists public.chat_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    preview text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_id_updated_at_idx
    on public.chat_sessions (user_id, updated_at desc);

alter table public.chat_sessions enable row level security;

drop policy if exists "Chat sessions are viewable by owner" on public.chat_sessions;
create policy "Chat sessions are viewable by owner"
    on public.chat_sessions
    for select
    using (auth.uid() = user_id);

drop policy if exists "Chat sessions are insertable by owner" on public.chat_sessions;
create policy "Chat sessions are insertable by owner"
    on public.chat_sessions
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "Chat sessions are updatable by owner" on public.chat_sessions;
create policy "Chat sessions are updatable by owner"
    on public.chat_sessions
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Chat sessions are deletable by owner" on public.chat_sessions;
create policy "Chat sessions are deletable by owner"
    on public.chat_sessions
    for delete
    using (auth.uid() = user_id);

create table if not exists public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.chat_sessions (id) on delete cascade,
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    role text not null check (role in ('user', 'agent')),
    content text not null,
    sources jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_id_created_at_idx
    on public.chat_messages (session_id, created_at asc);

alter table public.chat_messages enable row level security;

drop policy if exists "Chat messages are viewable by owner" on public.chat_messages;
create policy "Chat messages are viewable by owner"
    on public.chat_messages
    for select
    using (auth.uid() = user_id);

drop policy if exists "Chat messages are insertable by owner" on public.chat_messages;
create policy "Chat messages are insertable by owner"
    on public.chat_messages
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "Chat messages are updatable by owner" on public.chat_messages;
create policy "Chat messages are updatable by owner"
    on public.chat_messages
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Chat messages are deletable by owner" on public.chat_messages;
create policy "Chat messages are deletable by owner"
    on public.chat_messages
    for delete
    using (auth.uid() = user_id);

create or replace function public.touch_chat_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.chat_sessions
    set updated_at = now(),
        preview = case
            when new.role = 'user' then left(new.content, 120)
            else preview
        end
    where id = new.session_id;

    return new;
end;
$$;

drop trigger if exists on_chat_message_created on public.chat_messages;
create trigger on_chat_message_created
after insert on public.chat_messages
for each row execute function public.touch_chat_session();

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null unique,
    full_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
    on public.profiles
    for select
    using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
    on public.profiles
    for insert
    with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
    on public.profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'full_name', '')
    )
    on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        updated_at = now();

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();