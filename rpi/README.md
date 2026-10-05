# RPi camera setup — Field Scarecrow #1 & #2

Run this on **each** Raspberry Pi separately (2 Pis, 2 cameras).

## 1. One-time Supabase setup (do this once, not per-Pi)

In the mobile repo, run `supabase/schema.sql` in your Supabase SQL editor.
It creates `devices` and `detection_logs` and seeds two device rows.
Copy each row's `id` (uuid) — that's the `DEVICE_ID` for that Pi.

## 2. On each Pi

```bash
pip install -r requirements.txt

export SUPABASE_URL="https://fbdxczpdiwjlbkbdlldl.supabase.co"
export SUPABASE_SERVICE_KEY="<service_role key, from Supabase → Settings → API>"
export DEVICE_ID="<this Pi's uuid from the devices table>"
export CAMERA_INDEX=0     # 0 for the default/only camera on this Pi

python scarecrow_pi.py
```

The service_role key belongs **only** on the Pi — never put it in the
mobile app (the app only uses the public anon key, which can only read).

## 3. Point the app at it

- Find this Pi's local IP (`hostname -I` on the Pi, or check your router).
- In the app: **Settings → Camera Devices**, enter that IP for the matching
  device, tap the checkmark.
- Open **Live Feed** — you should see the stream. If detections fire,
  they'll appear on **Activity Logs** within a few seconds (real-time).

## 4. Run it automatically on boot (recommended)

Create `/etc/systemd/system/scarecrow.service`:

```ini
[Unit]
Description=ScareCROW camera + detection
After=network.target

[Service]
Environment=SUPABASE_URL=https://fbdxczpdiwjlbkbdlldl.supabase.co
Environment=SUPABASE_SERVICE_KEY=your_service_role_key
Environment=DEVICE_ID=this_pis_device_uuid
Environment=CAMERA_INDEX=0
ExecStart=/usr/bin/python3 /home/pi/scarecrow_pi.py
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable scarecrow
sudo systemctl start scarecrow
```

## Plugging in your trained model

Open `scarecrow_pi.py` and fill in the two `TODO`s:
- **TODO 1** — load your trained model once at startup (TFLite, YOLO, etc.)
- **TODO 2** — run inference per-frame in `run_inference()` and return a
  dict like `{"species": "crow", "confidence": 0.91, "count": 3}`, or
  `None` if nothing was detected.

Everything else (streaming to the app, writing to Activity Logs, the
online/offline heartbeat) already works — you're only swapping in the model.

## Maintenance / on-site checks

Since the Pi and phone talk over local WiFi, checking a camera on-site is:
1. Make sure your phone is on the same WiFi as the Pi.
2. Confirm the service is running: `sudo systemctl status scarecrow` (or
   just visit `http://<pi-ip>:5000/health` from a browser on the same WiFi).
3. If the Pi's IP changed (e.g. DHCP reassigned it), update it in the app
   under **Settings → Camera Devices**.

Bluetooth isn't used here — video streaming and Supabase writes both need
more bandwidth/reliability than BLE comfortably gives you, and WiFi already
covers both the live view and the on-site maintenance case.
