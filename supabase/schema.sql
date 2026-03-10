-- SAVINGPLUS Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  currency text default 'USD',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- CATEGORIES
-- ============================================
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text default '#6366f1',
  icon text default 'tag',
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "Users can manage own categories"
  on public.categories for all using (auth.uid() = user_id);

-- ============================================
-- EXPENSES
-- ============================================
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  amount decimal(12,2) not null,
  description text not null,
  date date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.expenses enable row level security;

create policy "Users can manage own expenses"
  on public.expenses for all using (auth.uid() = user_id);

-- ============================================
-- BUDGETS
-- ============================================
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  amount decimal(12,2) not null,
  month integer not null check (month between 1 and 12),
  year integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, category_id, month, year)
);

alter table public.budgets enable row level security;

create policy "Users can manage own budgets"
  on public.budgets for all using (auth.uid() = user_id);

-- ============================================
-- BILLS
-- ============================================
create table public.bills (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  amount decimal(12,2) not null,
  due_date date not null,
  is_recurring boolean default false,
  recurrence text check (recurrence in ('weekly', 'monthly', 'yearly')),
  is_paid boolean default false,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.bills enable row level security;

create policy "Users can manage own bills"
  on public.bills for all using (auth.uid() = user_id);

-- ============================================
-- SAVINGS GOALS
-- ============================================
create table public.savings_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  target_amount decimal(12,2) not null,
  current_amount decimal(12,2) default 0,
  deadline date,
  color text default '#10b981',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.savings_goals enable row level security;

create policy "Users can manage own savings goals"
  on public.savings_goals for all using (auth.uid() = user_id);

-- ============================================
-- INCOME & DEBTS (for ratio calculator)
-- ============================================
create table public.income_debts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('income', 'debt')),
  name text not null,
  amount decimal(12,2) not null,
  is_monthly boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.income_debts enable row level security;

create policy "Users can manage own income_debts"
  on public.income_debts for all using (auth.uid() = user_id);

-- ============================================
-- AI CONVERSATIONS
-- ============================================
create table public.ai_conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ai_conversations enable row level security;

create policy "Users can manage own conversations"
  on public.ai_conversations for all using (auth.uid() = user_id);

-- ============================================
-- SEED DEFAULT CATEGORIES
-- ============================================
create or replace function public.seed_default_categories()
returns trigger as $$
begin
  insert into public.categories (user_id, name, color, icon) values
    (new.id, 'Housing', '#ef4444', 'home'),
    (new.id, 'Food & Dining', '#f97316', 'utensils'),
    (new.id, 'Transportation', '#eab308', 'car'),
    (new.id, 'Utilities', '#22c55e', 'zap'),
    (new.id, 'Entertainment', '#3b82f6', 'film'),
    (new.id, 'Healthcare', '#ec4899', 'heart'),
    (new.id, 'Shopping', '#8b5cf6', 'shopping-bag'),
    (new.id, 'Education', '#06b6d4', 'book-open'),
    (new.id, 'Personal', '#64748b', 'user'),
    (new.id, 'Other', '#9ca3af', 'more-horizontal');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.seed_default_categories();
