export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const targetUrl = process.env.TARGET_URL;
  if (!targetUrl) {
    return res.status(500).json({ ok: false, error: "Missing TARGET_URL" });
  }

  const method = process.env.KEEPALIVE_METHOD || "GET";
  const timeoutMs = Number(process.env.TIMEOUT_MS || 60000);
  const expectedStatus = process.env.EXPECTED_STATUS
    ? Number(process.env.EXPECTED_STATUS)
    : null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    Accept: "application/json,text/plain,*/*",
    "User-Agent": "render-keepalive/1.0 (+vercel-cron)"
  };

  if (process.env.KEEPALIVE_AUTH_TOKEN) {
    headers.Authorization = `Bearer ${process.env.KEEPALIVE_AUTH_TOKEN}`;
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      cache: "no-store",
      signal: controller.signal
    });

    const ok = expectedStatus ? response.status === expectedStatus : response.status < 500;

    return res.status(ok ? 200 : 502).json({
      ok,
      targetUrl,
      method,
      status: response.status,
      successRule: expectedStatus ? `status === ${expectedStatus}` : "status < 500",
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      targetUrl,
      method,
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    clearTimeout(timeout);
  }
}
