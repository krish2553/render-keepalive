const targetUrl = process.env.TARGET_URL;
const method = process.env.KEEPALIVE_METHOD || "GET";
const timeoutMs = Number(process.env.TIMEOUT_MS || 15000);
const expectedStatus = process.env.EXPECTED_STATUS
  ? Number(process.env.EXPECTED_STATUS)
  : null;

if (!targetUrl) {
  console.error("Missing TARGET_URL environment variable.");
  process.exit(1);
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), timeoutMs);

const headers = {
  Accept: "application/json,text/plain,*/*",
  "User-Agent": "render-keepalive/1.0 (+github-actions)"
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

  const ok = expectedStatus ? response.status === expectedStatus : response.ok;
  const bodyPreview = await response.text().then((body) => body.slice(0, 300)).catch(() => "");

  console.log(
    JSON.stringify(
      {
        targetUrl,
        method,
        status: response.status,
        ok,
        checkedAt: new Date().toISOString(),
        bodyPreview
      },
      null,
      2
    )
  );

  process.exit(ok ? 0 : 1);
} catch (error) {
  console.error(
    JSON.stringify(
      {
        targetUrl,
        method,
        ok: false,
        checkedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exit(1);
} finally {
  clearTimeout(timeout);
}
