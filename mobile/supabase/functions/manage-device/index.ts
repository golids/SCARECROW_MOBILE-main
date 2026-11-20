
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_ID = "8c24d05b-35a4-420d-b605-3b601ea6b229";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return respond({ error: "Method not allowed." }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return respond({ error: "Authentication required." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return respond({ error: "Server configuration is incomplete." }, 500);
    }

    // Verify the currently logged-in administrator.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authorization },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller || caller.id !== ADMIN_ID) {
      return respond({ error: "Administrator access required." }, 403);
    }

    const body = await req.json();

    const password = body?.password;
    const operation = body?.operation;
    const deviceId = body?.deviceId ?? null;
    const payload = body?.payload ?? {};

    if (
      typeof password !== "string" ||
      password.length === 0 ||
      password.length > 256
    ) {
      return respond({ error: "Enter your administrator password." }, 400);
    }

    if (!["create", "edit", "archive"].includes(operation)) {
      return respond({ error: "Invalid device operation." }, 400);
    }

    if (
      payload === null ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return respond({ error: "Invalid device information." }, 400);
    }

    if (
      (operation === "edit" || operation === "archive") &&
      (typeof deviceId !== "string" || deviceId.length === 0)
    ) {
      return respond({ error: "A valid device ID is required." }, 400);
    }

    if (operation === "create" || operation === "edit") {
      if (
        typeof payload.name !== "string" ||
        !payload.name.trim() ||
        typeof payload.location !== "string" ||
        !payload.location.trim()
      ) {
        return respond(
          { error: "Device name and field location are required." },
          400
        );
      }

      if (
        payload.port !== undefined &&
        payload.port !== null &&
        (!Number.isInteger(Number(payload.port)) ||
          Number(payload.port) < 1 ||
          Number(payload.port) > 65535)
      ) {
        return respond({ error: "Port must be between 1 and 65535." }, 400);
      }

      if (
        payload.ip_address !== undefined &&
        payload.ip_address !== null &&
        typeof payload.ip_address !== "string"
      ) {
        return respond({ error: "Invalid IP address." }, 400);
      }

      if (
        payload.status !== undefined &&
        !["online", "offline"].includes(payload.status)
      ) {
        return respond({ error: "Invalid device status." }, 400);
      }
    }

    // Verify the administrator password for THIS operation only.
    // No password or temporary unlocked state is stored.
    if (!caller.email) {
      return respond({ error: "Administrator email is unavailable." }, 400);
    }

    const verificationClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: verification,
      error: verificationError,
    } = await verificationClient.auth.signInWithPassword({
      email: caller.email,
      password,
    });

    if (verificationError || verification.user?.id !== caller.id) {
      return respond(
        { error: "Incorrect administrator password." },
        401
      );
    }

    // Service-role access stays on the server, never in the mobile app.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await adminClient.rpc("admin_manage_device", {
      p_admin_id: caller.id,
      p_operation: operation,
      p_device_id: deviceId,
      p_payload: payload,
    });

    if (error) {
      console.error("Device operation failed:", error.message);
      return respond(
        { error: "The device operation could not be completed." },
        400
      );
    }

    return respond({
      success: true,
      message: "Device operation completed successfully.",
      deviceId: data,
    });
  } catch (error) {
    console.error("Manage-device function error:", error);
    return respond(
      { error: "Unable to process the device operation." },
      500
    );
  }
});