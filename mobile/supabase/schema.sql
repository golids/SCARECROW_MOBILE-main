
-- =========================================================
-- SCARECROW DATABASE SCHEMA
-- Client Mobile App + Admin Web App + Raspberry Pi
-- Existing Supabase project
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- 1. DEVICES
-- One row per physical Raspberry Pi camera.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    ip_address TEXT,
    port INT NOT NULL DEFAULT 5000,
    status TEXT NOT NULL DEFAULT 'offline'
        CHECK (status IN ('online', 'offline')),
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    archived_by UUID
);

-- =========================================================
-- 2. DETECTION LOGS
-- One row per detection or device event.
-- Written by the Raspberry Pi through a secure server-side
-- process using the service role key.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.detection_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    device_id UUID NOT NULL
        REFERENCES public.devices(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    label TEXT NOT NULL,
    species TEXT,
    confidence NUMERIC,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 3. DEVICE ASSIGNMENTS
-- This table should already exist in your current project.
-- It connects farmer/client accounts to assigned devices.
--
-- Existing columns:
-- id, device_id, user_id, assigned_at,
-- unassigned_at, assigned_by
-- =========================================================

-- Do not recreate an existing device_assignments table.

-- =========================================================
-- 4. INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS detection_logs_created_at_idx
ON public.detection_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS detection_logs_device_id_idx
ON public.detection_logs (device_id);

CREATE INDEX IF NOT EXISTS device_assignments_user_device_idx
ON public.device_assignments (user_id, device_id);

CREATE INDEX IF NOT EXISTS device_assignments_active_idx
ON public.device_assignments (device_id, user_id)
WHERE unassigned_at IS NULL;

-- =========================================================
-- 5. OPTIONAL SEED DATA
-- Only insert these if you still need the two sample devices.
-- Do not run repeatedly if you do not want duplicates.
-- =========================================================

-- INSERT INTO public.devices (name, location)
-- VALUES
--     ('Field Scarecrow #1', 'North Field, Section A'),
--     ('Field Scarecrow #2', 'East Field, Section B');

-- =========================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 7. DEVICES POLICIES
-- Admins: read all devices.
-- Clients: read only assigned, active, non-archived devices.
-- Clients cannot update device records.
-- =========================================================

DROP POLICY IF EXISTS
"Authenticated users can read devices"
ON public.devices;

DROP POLICY IF EXISTS
"Admins and assigned clients can read devices"
ON public.devices;

DROP POLICY IF EXISTS
"Authenticated users can update device ip"
ON public.devices;

CREATE POLICY "Admins and assigned clients can read devices"
ON public.devices
FOR SELECT
TO authenticated
USING (
    public.is_scarecrow_admin()
    OR (
        is_archived = FALSE
        AND EXISTS (
            SELECT 1
            FROM public.device_assignments AS da
            WHERE da.device_id = devices.id
              AND da.user_id = auth.uid()
              AND da.unassigned_at IS NULL
        )
    )
);

-- =========================================================
-- 8. DETECTION LOG POLICIES
-- Admins: read all logs.
-- Clients: read logs belonging to their assigned devices.
-- =========================================================

DROP POLICY IF EXISTS
"Authenticated users can read detection_logs"
ON public.detection_logs;

DROP POLICY IF EXISTS
"Admins and assigned clients can read detection logs"
ON public.detection_logs;

CREATE POLICY "Admins and assigned clients can read detection logs"
ON public.detection_logs
FOR SELECT
TO authenticated
USING (
    public.is_scarecrow_admin()
    OR EXISTS (
        SELECT 1
        FROM public.device_assignments AS da
        WHERE da.device_id = detection_logs.device_id
          AND da.user_id = auth.uid()
          AND da.unassigned_at IS NULL
    )
);

-- =========================================================
-- END OF SCHEMA
-- =========================================================