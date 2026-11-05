# Deploy DineNova to Vercel

Vercel can serve this project as one deployment: the React/Vite site is static, and the Express API runs as a Vercel Function at `/api/*`. The frontend and API share one HTTPS origin, so the browser session cookie can use `SameSite=Lax`. The `api/[...path].js` adapter reuses the Express app and caches its MongoDB connection for warm function instances. Vercel documents Express as a supported function deployment and Vite SPA rewrites for deep links: [Express on Vercel](https://vercel.com/docs/frameworks/backend/express), [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## 1. Prepare MongoDB Atlas

1. Use a production database/cluster and a dedicated database user. Do not reuse your Atlas account password as the database password.
2. In Atlas **Network Access**, allow the Vercel API's outbound IP addresses. Vercel uses dynamic egress addresses by default. For a restricted production allowlist, Vercel currently offers Static IPs on Pro and Enterprise plans; enable them in Vercel **Project Settings → Connectivity**, then add the displayed IP addresses to Atlas. Avoid `0.0.0.0/0` for production. See [Vercel IP allowlisting](https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address).
3. Copy the connection string from Atlas **Connect → Drivers**. Set it as `MONGODB_URI` in Vercel. Include the production database name in the URI path and URL-encode special characters in the database user's password.
4. Keep the production cluster running. A paused cluster cannot serve customers.
5. Review backups in Atlas **Database → Backup**. Backup options depend on the cluster type: Flex takes daily snapshots and retains the last 8; M10+ supports Cloud Backup policies. Free M0 backup availability is currently an optional private preview; if Atlas offers it to this project, it takes daily snapshots, retains the last 4, and costs up to $3/month. M0 backups pause while the cluster is paused. Verify Atlas billing and that a recent snapshot exists before launch.
6. Restore a snapshot to a separate test cluster before launch and confirm the restored data is usable.

For M10+, MongoDB's published example policy retains daily snapshots for 7 days, weekly snapshots for 4 weeks, monthly snapshots for 12 months, and yearly snapshots for 1 year. Adjust retention to your recovery needs and budget. See [Atlas backup policies](https://www.mongodb.com/docs/atlas/backup/cloud-backup/configure-backup-policy/), [Atlas backup guidance](https://www.mongodb.com/docs/atlas/architecture/current/backups/), and [Free cluster backups](https://www.mongodb.com/docs/atlas/backup/cloud-backup/free-cluster-backup/).

## 2. Configure password-reset email

The API can send password-reset codes with Resend. Email delivery is optional and does not block the rest of the API from starting. New accounts are signed in immediately and do not require email verification. In Resend, add a domain or sending subdomain you own, publish the DNS records it provides, wait for the domain to show as verified, then create an API key. Resend requires a verified domain to send email: [Resend Verified Domains](https://resend.com/docs/dashboard/domains/introduction).

In Vercel, add these as **Production-only** environment variables:

```text
RESEND_API_KEY=<private Resend API key>
EMAIL_FROM="DineNova <noreply@mail.your-real-domain.com>"
```

Replace the example sender with an address at the verified domain. Keep the key in Vercel's server environment only; never prefix it with `VITE_`.

## 3. Create the Vercel project

1. Push this app folder to a Git provider and import that repository into Vercel. If the repository contains an outer workspace folder, set Vercel's **Root Directory** to the folder containing this app's `package.json`, `vite.config.js`, `server/`, `api/`, and `vercel.json`.
2. Use the Vite framework preset. The checked-in `vercel.json` sets the install command, build command, `dist` output folder, and SPA fallback for pages such as `/profile` and `/my-bookings`. It installs the frontend and API dependencies.
3. Assign or confirm the Vercel production domain (the project `*.vercel.app` domain or your custom domain). Use the same domain for both the website and API.
4. Add the following **Production** environment variables in Vercel. Set the frontend variables for Production and Preview so builds can complete; keep database, email, and session secrets Production-only unless you intentionally maintain a separate preview database.

### Frontend build variables

```text
VITE_API_URL=/
VITE_DEMO_MODE=false
VITE_GOOGLE_OAUTH_ENABLED=false
```

`VITE_API_URL=/` tells the frontend to call the same-origin `/api` functions. The production build rejects a missing API setting or demo mode. Enable Google sign-in only after configuring the optional API credentials and callback below.

### API variables

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Optional exact frontend origin; defaults to Vercel's production URL |
| `API_PUBLIC_URL` | Optional public API origin; defaults to Vercel's production URL |
| `MONGODB_URI` | Production Atlas URI including a database name |
| `SESSION_SECRET` | Unique random value with 32+ characters |
| `SESSION_COOKIE_SAMESITE` | `lax` |
| `RESEND_API_KEY` | Optional private Resend API key for password reset |
| `EMAIL_FROM` | Optional sender address at the verified Resend domain |
| `ADMIN_EMAILS` | Owner email allowlist, especially for Google sign-in |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional; set both or leave both empty |
| `GOOGLE_CALLBACK_URL` | If enabled: `https://dinenova.vercel.app/api/auth/google/callback` |

Replace `dinenova.vercel.app` with the exact production domain you assign. If you change domains later, update `FRONTEND_URL`, `API_PUBLIC_URL`, and the Google callback, then redeploy.

Generate a session secret locally with Node.js and paste the output into Vercel:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Vercel provisions HTTPS for the deployment. The API sets a secure session cookie in production and only allows credentialed cross-origin requests from `FRONTEND_URL`. Since frontend and API use the same origin here, `SameSite=Lax` is appropriate. Vercel Functions have a 4.5 MB request/response body limit; menu-photo uploads are optimized to no more than 4 MB before upload. See [Vercel Function limits](https://vercel.com/docs/functions/limitations).

## 4. Create the owner account and deploy

Provision the owner in MongoDB before launch. Use the existing `admin:create` command with the production `MONGODB_URI` and a temporary `ADMIN_INITIAL_PASSWORD`; remove that temporary setting immediately after creating the owner. If running the command from your computer, Atlas Network Access must temporarily allow your current IP.

Commit and push the Vercel files, then deploy the Production branch. The Vercel API function is `api/[...path].js`; check `https://<production-domain>/api/health` for `ok: true`. Function logs are available in the Vercel project dashboard. New user registration will fail until the verified Resend sender and API key are configured.

Before sharing with customers, confirm that a new customer can register and is taken to the home page with a welcome message, the owner can sign in to the admin area, a customer can submit a reservation, and Atlas has a recent backup that has been restored successfully to a separate cluster.

This repository now contains the Vercel routing and runtime adapter, but it does not contain your Vercel project, custom domain, Atlas account, Resend key, or live database credentials. Those account settings must be entered in their respective dashboards.
