
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

let channelCounter = 0;

function uniqueChannel(name: string) {
  channelCounter += 1;
  return `${name}-${channelCounter}`;
}

export function isRecentlyAlive(device: Device): boolean {
  if (!device.last_seen) return false;

  const lastSeen = new Date(device.last_seen).getTime();

  if (Number.isNaN(lastSeen)) return false;

  return Date.now() - lastSeen < 30_000;
}

/**
 * Fetch only active devices visible to the authenticated client.
 * Supabase RLS must restrict this query to assigned devices.
 */
export async function fetchDevices(): Promise<Device[]> {
  const { data, error } = await supabase
    .from("devices")
    .select(
      "id, name, location, ip_address, port, status, last_seen, is_archived"
    )
    .eq("is_archived", false)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []) as Device[];
}

/**
 * Fetch detection records visible to the authenticated client.
 * RLS on detection_logs must restrict records to assigned devices.
 */
export async function fetchDetectionLogs(
  limit = 50
): Promise<DetectionLog[]> {
  const { data, error } = await supabase
    .from("detection_logs")
    .select("id, device_id, event_type, label, species, confidence, image_url, created_at, devices(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    device_id: row.device_id,
    device_name: row.devices?.name ?? "Unknown device",
    event_type: row.event_type,
    label: row.label,
    species: row.species ?? null,
    confidence: row.confidence ?? null,
    image_url: row.image_url ?? null,
    created_at: row.created_at,
  }));
}

/**
 * Subscribe to device changes.
 * Re-fetching the list ensures the screen uses current RLS-filtered data.
 */
export function subscribeToDevices(onChange: () => void) {
  const channel = supabase
    .channel(uniqueChannel("client-devices"))
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
 * Subscribe to new detection records.
 */
export function subscribeToDetectionLogs(
  onInsert: (log: DetectionLog) => void
) {
  const channel = supabase
    .channel(uniqueChannel("client-detection-logs"))
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "detection_logs",
      },
      async (payload) => {
        const row = payload.new as any;

        // Confirm that this client can read the related device.
        // RLS on devices prevents exposing another client's device name.
        const { data: device } = await supabase
          .from("devices")
          .select("name")
          .eq("id", row.device_id)
          .maybeSingle();

        if (!device) return;

        onInsert({
          id: row.id,
          device_id: row.device_id,
          device_name: device.name ?? "Unknown device",
          event_type: row.event_type,
          label: row.label,
          species: row.species ?? null,
          confidence: row.confidence ?? null,
          image_url: row.image_url ?? null,
          created_at: row.created_at,
        });
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
