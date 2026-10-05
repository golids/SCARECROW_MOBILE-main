"""
scarecrow_pi.py — runs ON each Raspberry Pi camera unit.

Run one copy of this per Pi (you have 2: Field Scarecrow #1 and #2).
Each Pi needs its own DEVICE_ID (the uuid Supabase generated for its row
in the `devices` table — see supabase/schema.sql in the mobile repo).

What it does:
  1. Serves the camera as an MJPEG stream at http://<pi-ip>:5000/video_feed
     — this is exactly what app/(tabs)/live.tsx expects.
  2. Runs your trained ML model on frames and, on a detection, writes a row
     to `detection_logs` — this is what makes it show up on Activity Logs.
  3. Sends a heartbeat to `devices` every 10s (status + last_seen) so the
     app can tell online vs offline.

Fill in the two TODOs (model loading + inference) with your trained
dataset/model. Everything else (streaming, Supabase writes, heartbeat)
is ready to run as-is.
"""

import os
import time
import threading
from datetime import datetime, timezone

import cv2
from flask import Flask, Response
import requests

# ── Config — set these per-Pi ────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]            # e.g. https://xxxx.supabase.co
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]  # service_role key — NEVER put this in the mobile app
DEVICE_ID = os.environ["DEVICE_ID"]                  # this Pi's uuid from the `devices` table
CAMERA_INDEX = int(os.environ.get("CAMERA_INDEX", "0"))
STREAM_PORT = int(os.environ.get("STREAM_PORT", "5000"))
DETECTION_COOLDOWN_SEC = 5  # don't spam a log row every single frame

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
}

app = Flask(__name__)
camera = cv2.VideoCapture(CAMERA_INDEX)
_last_detection_at = 0.0

# ── TODO 1: load your trained model here (once, at startup) ─────────────
# Example for a TFLite model trained on your bird dataset:
#
#   import tflite_runtime.interpreter as tflite
#   interpreter = tflite.Interpreter(model_path="bird_model.tflite")
#   interpreter.allocate_tensors()
#
model = None  # <- replace with your loaded model


def run_inference(frame):
    """
    TODO 2: replace this with real inference using `model`.
    Return either None (nothing detected) or a dict describing the
    detection, e.g.:
        {"species": "crow", "confidence": 0.91, "count": 3}
    """
    return None


def post_detection(result: dict):
    """Write a row to detection_logs — this is what Activity Logs reads."""
    label = f"{result.get('species', 'Bird').title()} Detected"
    if result.get("count"):
        label += f" ({result['count']})"

    payload = {
        "device_id": DEVICE_ID,
        "event_type": "bird_detected",
        "label": label,
        "species": result.get("species"),
        "confidence": result.get("confidence"),
    }
    try:
        requests.post(
            f"{SUPABASE_URL}/rest/v1/detection_logs",
            headers=HEADERS,
            json=payload,
            timeout=5,
        )
    except requests.RequestException as e:
        print("Failed to post detection:", e)


def send_heartbeat():
    """Runs forever in a background thread: tells the app this Pi is alive."""
    while True:
        try:
            requests.patch(
                f"{SUPABASE_URL}/rest/v1/devices?id=eq.{DEVICE_ID}",
                headers=HEADERS,
                json={
                    "status": "online",
                    "last_seen": datetime.now(timezone.utc).isoformat(),
                },
                timeout=5,
            )
        except requests.RequestException as e:
            print("Heartbeat failed:", e)
        time.sleep(10)


def gen_frames():
    """MJPEG generator — also runs inference on each frame it captures."""
    global _last_detection_at
    while True:
        success, frame = camera.read()
        if not success:
            time.sleep(0.5)
            continue

        result = run_inference(frame)
        if result and (time.time() - _last_detection_at) > DETECTION_COOLDOWN_SEC:
            _last_detection_at = time.time()
            post_detection(result)

        ok, buffer = cv2.imencode(".jpg", frame)
        if not ok:
            continue
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
        )


@app.route("/video_feed")
def video_feed():
    return Response(gen_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route("/health")
def health():
    return {"status": "ok", "device_id": DEVICE_ID}


if __name__ == "__main__":
    threading.Thread(target=send_heartbeat, daemon=True).start()
    app.run(host="0.0.0.0", port=STREAM_PORT, threaded=True)
