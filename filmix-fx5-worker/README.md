# Filmix FX5 Worker for Lampa

This Worker implements the two endpoints expected by the FX5 plugin:

- `/ensure?uid=...&name=Lampa_FX5`
- `/app?m=user_profile&...`

It uses Filmix APP API's documented device-code flow (`token_request`). It does **not** automate logging into the Filmix website or silently remove other devices.

## 1. Create the KV namespace

In Cloudflare Dashboard:

1. Open **Workers & Pages → KV**.
2. Create a namespace named `FX5_KV`.
3. Open the Worker → **Settings → Bindings → Add → KV namespace**.
4. Set the variable name to exactly `FX5_KV` and select the namespace.

## 2. Deploy

Create a Worker, paste the contents of `worker.js`, and deploy it.

Open:

```
https://YOUR-WORKER.workers.dev/health
```

Expected response:

```json
{"ok":true,"service":"Filmix FX5 Worker","kv":true}
```

## 3. Configure Lampa

In Lampa open **Settings → Filmix FX 5 → Cloudflare Worker address** and enter the Worker URL without a trailing slash, for example:

```
https://your-worker.your-subdomain.workers.dev
```

## 4. Bind the device (one-time manual confirmation)

1. In Lampa open **Settings → Filmix FX 5 → Bind device / refresh**.
2. The Worker requests a Filmix device code. The plugin stores the returned code as `fx5_code`.
3. Open [filmix.gg/consoles](https://filmix.gg/consoles) in a browser logged into your own Filmix account and enter that code.
4. Return to Lampa and press the binding/check button again. The Worker polls `token_request`, stores the issued device token in KV, and injects it into later `/app` requests.

The token stays in your Cloudflare KV namespace; it is not returned to the browser.

## Notes

- The Worker requires the `FX5_KV` binding. Without it, the endpoints return a configuration error.
- The Worker proxies only Filmix APP API method paths; it is not an arbitrary URL proxy.
- Filmix controls its own API availability and device limits. This Worker cannot bypass account restrictions or a Filmix-side block.
- Do not commit Filmix usernames, passwords, session cookies, or device tokens to GitHub.


## Automated deployment from GitHub

The repository includes a GitHub Actions workflow at
`.github/workflows/deploy-filmix-fx5-worker.yml`. It creates the `FX5_KV`
namespace if it does not exist and deploys the Worker whenever files in this
folder change (or when manually started).

Add these two **repository Actions secrets** in GitHub:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token with Account permissions
  `Workers Scripts: Edit` and `Workers KV Storage: Edit`, scoped to the
  account where the Worker should be deployed.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID.

In GitHub, open **Settings → Secrets and variables → Actions → New repository
secret** for each value. Do not paste the API token into chat or commit it to
the repository.

Then open **Actions → Deploy Filmix FX5 Worker → Run workflow**. After a
successful run, the Worker will be available at
`https://filmix-fx5-worker.<your-workers-subdomain>.workers.dev` (the exact
subdomain is shown in the Cloudflare Workers dashboard). Use that base URL in
the FX5 plugin settings.
