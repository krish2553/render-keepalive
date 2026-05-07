const targetUrl = process.env.TARGET_URL;
const method = process.env.KEEPALIVE_METHOD || "GET";
const timeoutMs = Number(process.env.TIMEOUT_MS || 60000);
const maxAttempts = Number(process.env.MAX_ATTEMPTS || 3);
const expectedStatus = process.env.EXPECTED_STATUS
  ? Number(process.env.EXPECTED_STATUS)
  : null;

if (!targetUrl) {
  console.error("Missing TARGET_URL environment variable.");
  process.exit(1);
}

const headers = {
  Accept: "application/json,text/plain,*/*",
  "User-Agent": "render-keepalive/1.0 (+github-actions)"
};

if (process.env.KEEPALIVE_AUTH_TOKEN) {
  headers.Authorization = `Bearer ${process.env.KEEPALIVE_AUTH_TOKEN}`;
}

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
          attempt,
          maxAttempts,
          status: response.status,
          ok,
          checkedAt: new Date().toISOString(),
          bodyPreview
        },
        null,
        2
      )
    );

    if (ok) {
      process.exit(0);
    }
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          targetUrl,
          method,
          attempt,
          maxAttempts,
          ok: false,
          checkedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error)
        },
        null,
        2
      )
    );
  } finally {
    clearTimeout(timeout);
  }

  if (attempt < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

process.exit(1);
