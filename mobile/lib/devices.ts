// mobile/lib/devices.ts

import { supabase } from "./supabase";

export type DeviceStatus = "online" | "offline";

export interface Device {
  id: string;
  name: string;
  location: string;
  ip_address: string | null;
  port: number;
  status: DeviceStatus;
  last_seen: string | null;
  is_archived?: boolean;
}

export interface DetectionLog {
  id: number;
  device_id: string;
  device_name: string;
  event_type: string;
  label: string;
  species: string | null;
  confidence: number | null;
  image_url: string | null;
  created_at: string;
}

/**
 * A device is online only if its latest heartbeat
 * was received within the last 30 seconds.
 */
export function isRecentlyAlive(device: Device): boolean {
  if (!device.last_seen) return false;

  const lastSeen = new Date(device.last_seen).getTime();

  if (Number.isNaN(lastSeen)) return false;

  return Date.now() - lastSeen < 30_000;
}

/**
 * Fetch active devices only.
 * Archived devices are excluded, matching the web dashboard.
 */
export async function fetchDevices(): Promise<Device[]> {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("is_archived", false)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []) as Device[];
}

// Give each subscription a unique channel name.
let channelCounter = 0;

const uniqueChannel = (base: string) =>
  `${base}-${++channelCounter}`;

/**
 * Listen for device inserts, updates, and deletes.
 * The screen reloads the active-device list after each change.
 */
export function subscribeToDevices(onChange: () => void) {
  const channel = supabase
    .channel(uniqueChannel("devices-changes"))
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "devices",
      },
      onChange
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Fetch recent detection and device event records.
 */
export async function fetchDetectionLogs(
  limit = 50
): Promise<DetectionLog[]> {
  const { data, error } = await supabase
    .from("detection_logs")
    .select("*, devices(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    device_id: row.device_id,
    device_name: row.devices?.name ?? "Unknown device",
    event_type: row.event_type,
    label: row.label,
    species: row.species,
    confidence: row.confidence,
    image_url: row.image_url,
    created_at: row.created_at,
  }));
}

/**
 * Listen for new detection log entries.
 * Fetch the related device name because the Realtime payload
 * does not contain the joined device record.
 */
export function subscribeToDetectionLogs(
  onInsert: (log: DetectionLog) => void
) {
  const channel = supabase
    .channel(uniqueChannel("detection-logs-changes"))
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "detection_logs",
      },
      async (payload) => {
        const row = payload.new as any;
        const deviceId = row.device_id;

        const { data: device } = await supabase
          .from("devices")
          .select("name")
          .eq("id", deviceId)
          .maybeSingle();

        onInsert({
          id: row.id,
          device_id: deviceId,
          device_name: device?.name ?? "Unknown device",
          event_type: row.event_type,
          label: row.label,
          species: row.species,
          confidence: row.confidence,
          image_url: row.image_url,
          created_at: row.created_at,
        });
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Update a device's connection details.
 */
export async function updateDeviceIp(
  deviceId: string,
  ip_address: string,
  port: number
) {
  const { error } = await supabase
    .from("devices")
    .update({ ip_address, port })
    .eq("id", deviceId);

  if (error) throw error;
}

export async function fetchArchivedDevices(): Promise<Device[]> {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("is_archived", true)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []) as Device[];
}