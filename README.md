# Render Keepalive

Small keepalive pinger for a Render backend. It sends a normal HTTP request to a safe endpoint, such as `/health`, every 10 minutes.

## Recommended Free Setup: GitHub Actions

GitHub Actions scheduled workflows can run as often as every 5 minutes. This repo uses every 10 minutes by default.

1. Create a GitHub repository and push these files.
2. In GitHub, go to `Settings` -> `Secrets and variables` -> `Actions`.
3. Add a repository secret:
   - `TARGET_URL`: `https://your-render-service.onrender.com/health`
4. Optional secrets:
   - `KEEPALIVE_METHOD`: defaults to `GET`
   - `KEEPALIVE_AUTH_TOKEN`: adds `Authorization: Bearer <token>`
   - `EXPECTED_STATUS`: defaults to any 2xx response
   - `TIMEOUT_MS`: defaults to `60000`
   - `MAX_ATTEMPTS`: defaults to `3`
5. Open `Actions` -> `Render keepalive` -> `Run workflow` once to test it.

The schedule is defined in `.github/workflows/render-keepalive.yml`:

```yaml
cron: "*/10 * * * *"
```

## Vercel Option

This repo also includes a Vercel serverless endpoint at `/api/keepalive` plus `vercel.json`.

Important: Vercel Hobby cron is currently limited to once per day. Use GitHub Actions for a free 10-minute keepalive, or use Vercel Pro if you want the included `*/10 * * * *` cron schedule to deploy.

Deploy steps:

1. Import this repo into Vercel.
2. Add the same environment variables in Vercel Project Settings.
3. Deploy.
4. Visit `https://your-vercel-project.vercel.app/api/keepalive` to test manually.

## Local Test

```bash
TARGET_URL=https://your-render-service.onrender.com/health npm run ping
```

On PowerShell:

```powershell
$env:TARGET_URL="https://your-render-service.onrender.com/health"
npm run ping
```

## Endpoint Choice

Use a safe endpoint that does not create, update, or delete data. A backend health route like `/health`, `/ping`, or `/api/health` is the right target. If your backend does not have one, add a simple health route and point `TARGET_URL` at it.
