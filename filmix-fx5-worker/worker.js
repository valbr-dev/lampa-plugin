/**
 * Filmix FX5 Cloudflare Worker
 *
 * Required binding:
 *   FX5_KV -> Cloudflare KV namespace
 *
 * Routes:
 *   GET /ensure?uid=<Lampa device id>&name=Lampa_FX5
 *     Starts/checks Filmix device-code authorization.
 *     Enter the returned code at https://filmix.gg/consoles, then call /ensure again.
 *
 *   GET /app?m=user_profile&...device query params...
 *     Proxies the Filmix APP API over HTTPS and injects the authorized device token
 *     stored in KV for this Lampa device id.
 */

const API_BASE = "http://filmixapp.vip/api/v2/";
const DEVICE = {
  apk: "2.2.13",
  os: "12",
  vendor: "Lampa"
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function validUid(uid) {
  return typeof uid === "string" && /^[a-zA-Z0-9_-]{8,128}$/.test(uid);
}

function deviceParams(uid, name) {
  const p = new URLSearchParams({
    app_lang: "ru_RU",
    user_dev_apk: DEVICE.apk,
    user_dev_id: uid,
    user_dev_name: (name || "Lampa_FX5").slice(0, 64),
    user_dev_os: DEVICE.os,
    user_dev_vendor: DEVICE.vendor
  });
  return p;
}

async function filmixFetch(path, params) {
  const url = new URL(path, API_BASE);
  if (params) {
    for (const [key, value] of params.entries()) {
      url.searchParams.set(key, value);
    }
  }
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "User-Agent": "Filmix-FX5-Lampa-Worker/1.0"
    },
    redirect: "follow"
  });
  const body = await response.text();
  return { response, body };
}

async function ensure(request, env) {
  if (!env.FX5_KV) {
    return json({ ok: false, reason: "config", message: "Create and bind the FX5_KV namespace." }, 500);
  }

  const url = new URL(request.url);
  const uid = url.searchParams.get("uid") || "";
  const name = url.searchParams.get("name") || "Lampa_FX5";
  if (!validUid(uid)) return json({ ok: false, reason: "bad_uid" }, 400);

  const savedToken = await env.FX5_KV.get("token:" + uid);
  if (savedToken) {
    return json({ ok: true, reason: "bound" });
  }

  try {
    const params = deviceParams(uid, name);
    const result = await filmixFetch("token_request", params);
    if (!result.response.ok) {
      return json({
        ok: false,
        reason: "api_error",
        status: result.response.status,
        detail: result.body.slice(0, 500)
      }, 502);
    }

    let data;
    try {
      data = JSON.parse(result.body);
    } catch {
      return json({ ok: false, reason: "bad_api_response", detail: result.body.slice(0, 300) }, 502);
    }

    if (data && data.user_dev_token) {
      await env.FX5_KV.put("token:" + uid, String(data.user_dev_token));
      return json({ ok: true, reason: "bound" });
    }

    if (data && data.user_code) {
      return json({
        ok: true,
        reason: "code",
        code: String(data.user_code),
        message: "Enter this code at https://filmix.gg/consoles, then run the binding check again."
      });
    }

    return json({
      ok: false,
      reason: "no_code_from_api",
      detail: JSON.stringify(data).slice(0, 500)
    }, 502);
  } catch (error) {
    return json({ ok: false, reason: "upstream_error", message: String(error).slice(0, 300) }, 502);
  }
}

async function appProxy(request, env) {
  if (!env.FX5_KV) {
    return json({ ok: false, reason: "config", message: "Create and bind the FX5_KV namespace." }, 500);
  }

  const incoming = new URL(request.url);
  const method = incoming.searchParams.get("m") || "";

  // Only allow API method paths, never arbitrary upstream URLs.
  if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(method) || method.includes("..")) {
    return json({ ok: false, reason: "bad_method" }, 400);
  }

  const params = new URLSearchParams(incoming.searchParams);
  params.delete("m");

  const uid = params.get("user_dev_id") || "";
  if (validUid(uid)) {
    const token = await env.FX5_KV.get("token:" + uid);
    if (token) params.set("user_dev_token", token);
  }

  try {
    const result = await filmixFetch(method, params);
    const headers = new Headers(result.response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Cache-Control", "no-store");

    return new Response(result.body, {
      status: result.response.status,
      headers
    });
  } catch (error) {
    return json({ ok: false, reason: "upstream_error", message: String(error).slice(0, 300) }, 502);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== "GET") return json({ ok: false, reason: "method_not_allowed" }, 405);

    const url = new URL(request.url);
    if (url.pathname === "/ensure") return ensure(request, env);
    if (url.pathname === "/app") return appProxy(request, env);
    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ ok: true, service: "Filmix FX5 Worker", kv: Boolean(env.FX5_KV) });
    }
    return json({ ok: false, reason: "not_found" }, 404);
  }
};
