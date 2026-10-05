-- ScareCROW: devices + detection_logs
-- Run this in Supabase SQL Editor once. Matches app/lib/devices.ts exactly.

create extension if not exists "pgcrypto";

-- One row per physical RPi camera (2 rows for your setup)
create table if not exists devices (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,               -- "Field Scarecrow #1"
  location    text not null,               -- "North Field, Section A"
  ip_address  text,                        -- "192.168.1.50" — local LAN IP, set once on-site
  port        int not null default 5000,   -- Flask/MJPEG server port on the Pi
  status      text not null default 'offline' check (status in ('online','offline')),
  last_seen   timestamptz,
  created_at  timestamptz not null default now()
);

-- One row per ML detection or device event, written by the Pi
create table if not exists detection_logs (
  id          bigint generated always as identity primary key,
  device_id   uuid not null references devices(id) on delete cascade,
  event_type  text not null,               -- 'bird_detected' | 'motion' | 'offline' | 'online' | 'system' | 'battery'
  label       text not null,               -- "Birds Detected (5)" — human-readable, shown in Activity Logs
  species     text,                        -- 'crow' | 'pigeon' | ... (from the ML model), nullable
  confidence  numeric,                     -- 0.0–1.0, nullable
  image_url   text,                        -- optional snapshot in Supabase Storage
  created_at  timestamptz not null default now()
);

create index if not exists detection_logs_created_at_idx on detection_logs (created_at desc);
create index if not exists detection_logs_device_id_idx on detection_logs (device_id);

-- Seed your 2 cameras (edit names/locations, leave ip_address null until installed on-site)
insert into devices (name, location) values
  ('Field Scarecrow #1', 'North Field, Section A'),
  ('Field Scarecrow #2', 'East Field, Section B')
on conflict do nothing;

-- Row Level Security -----------------------------------------------------
-- The app only ever reads (SELECT) with the anon key. Writes to these two
-- tables should come ONLY from the Pi, using the Supabase *service role* key
-- (never bundle the service role key inside the mobile app).

alter table devices enable row level security;
alter table detection_logs enable row level security;

create policy "Authenticated users can read devices"
  on devices for select
  to authenticated
  using (true);

create policy "Authenticated users can read detection_logs"
  on detection_logs for select
  to authenticated
  using (true);

-- Optional: let a logged-in user edit a device's IP from Settings
-- (used by app/lib/devices.ts -> updateDeviceIp). Remove if you'd rather IPs
-- only ever be set from the Pi/service role.
create policy "Authenticated users can update device ip"
  on devices for update
  to authenticated
  using (true)
  with check (true);
