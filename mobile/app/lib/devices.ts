// app/lib/devices.ts
//
// Data layer for the 2 Raspberry Pi scarecrow cameras.
// Expects two Supabase tables — see /supabase/schema.sql for the exact DDL:
//
//   devices          one row per RPi camera (2 rows for your setup)
//   detection_logs   one row per ML detection / device event, written by the Pi
//
// The Pi is the thing that writes to `devices` (heartbeat: status + last_seen)
// and `detection_logs` (every time its ML model fires). The app only reads.

import { supabase } from "./supabase";

export type DeviceStatus = "online" | "offline";

export interface Device {
  id: string;
  name: string;
  location: string;
  ip_address: string | null;
  port: number;
  status: DeviceStatus;
  last_seen: string | null; // ISO timestamp
}

export interface DetectionLog {
  id: number;
  device_id: string;
  device_name: string;
  event_type: "bird_detected" | "motion" | "offline" | "online" | "system" | "battery" | string;
  label: string;
  species: string | null;
  confidence: number | null;
  image_url: string | null;
  created_at: string; // ISO timestamp
}

/** Build the MJPEG stream URL for a device, given the Pi's local IP/port. */
export function streamUrlFor(device: Device): string | null {
  if (!device.ip_address) return null;
  return `http://${device.ip_address}:${device.port}/video_feed`;
}

/** A device counts as online if we've heard from it in the last 30s. */
export function isRecentlyAlive(device: Device): boolean {
  if (!device.last_seen) return false;
  return Date.now() - new Date(device.last_seen).getTime() < 30_000;
}

export async function fetchDevices(): Promise<Device[]> {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data as Device[];
}

/** Fires `onChange` whenever any device row is inserted/updated (status, last_seen, ip). */
export function subscribeToDevices(onChange: () => void) {
  const channel = supabase
    .channel("devices-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "devices" },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function fetchDetectionLogs(limit = 50): Promise<DetectionLog[]> {
  const { data, error } = await supabase
    .from("detection_logs")
    .select("*, devices(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data as any[]).map((row) => ({
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

/** Fires `onInsert` with the new row the moment the Pi writes a detection event. */
export function subscribeToDetectionLogs(onInsert: (log: DetectionLog) => void) {
  const channel = supabase
    .channel("detection-logs-changes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "detection_logs" },
      async (payload) => {
        // payload.new doesn't include the joined device name, so fetch it.
        const deviceId = (payload.new as any).device_id;
        const { data: device } = await supabase
          .from("devices")
          .select("name")
          .eq("id", deviceId)
          .single();

        onInsert({
          id: (payload.new as any).id,
          device_id: deviceId,
          device_name: device?.name ?? "Unknown device",
          event_type: (payload.new as any).event_type,
          label: (payload.new as any).label,
          species: (payload.new as any).species,
          confidence: (payload.new as any).confidence,
          image_url: (payload.new as any).image_url,
          created_at: (payload.new as any).created_at,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function updateDeviceIp(deviceId: string, ip_address: string, port: number) {
  const { error } = await supabase
    .from("devices")
    .update({ ip_address, port })
    .eq("id", deviceId);

  if (error) throw error;
}
