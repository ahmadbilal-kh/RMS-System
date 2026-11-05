# DineNova Restaurant Management System

A restaurant website and management MVP built with React + Vite, Express, MongoDB/Mongoose, and server sessions. The sample restaurant name, menu, contact details, photos, and reservation records are placeholders; update them for the client before delivery.

## What’s included

- Public home, menu, story, contact, and reservation pages.
- Customer registration with immediate sign-in, email/password sign-in, and a personal reservation list.
- Server-backed session authentication with bcrypt password hashes and Google OAuth when configured.
- Admin-only menu editing, reservation status management, a guest list, settings, and reservation reports.
- MongoDB models for users, menu items, reservations, and restaurant settings.
- Responsive local preview data so the React app can be viewed before MongoDB credentials are available.

Reports describe reservation activity and guest counts. They do not represent sales or revenue because this MVP has no ordering or payment workflow.

## Local preview

The app is in the `rms-system` subfolder. From your current PowerShell prompt at `C:\Projects\rms-system`, run:

```powershell
cd .\rms-system
npm.cmd install
npm.cmd --prefix server install
npm.cmd run dev
```

`npm.cmd run dev` starts the Vite frontend and the API when `server/.env` exists or `VITE_DEMO_MODE=false` is configured. Press Ctrl+C to stop both. Real API mode is the default in development. To intentionally use the local preview, set `VITE_DEMO_MODE=true`; preview authentication is not secure or shared with the database.

In local preview mode, changes are stored in this browser’s local storage. The owner email opens the dashboard; set `VITE_ADMIN_EMAIL` in the root `.env` to change its email. Customer accounts must be created and verified before preview sign-in.

Preview owner login:

- Email: `owner@seasoned.com`
- Password: `demo1234`

## Connect MongoDB and the API

1. Create a MongoDB Atlas database user and cluster, then allow the development machine’s IP in Atlas Network Access.
2. From `C:\Projects\rms-system`, enter the backend folder, copy its example settings, and configure `MONGODB_URI` and a unique `SESSION_SECRET` with at least 32 characters:

   ```powershell
   cd .\rms-system\server
   Copy-Item .env.example .env
   ```

   Keep `server/.env` private and out of source control.
3. In that `server` folder, run `npm.cmd install` once to install the API dependencies.
   If Node reports `querySrv ECONNREFUSED` for Atlas while a DNS lookup succeeds, add `MONGODB_DNS_SERVERS=1.1.1.1,1.0.0.1` to `server/.env` and restart the API. The admin and sample-data scripts use the same setting.
4. Return from `server` to the app root, create the frontend `.env`, then start both services:

   ```powershell
   cd ..
   Copy-Item .env.example .env
   npm.cmd run dev
   ```

   Keep `VITE_API_URL=http://localhost:4000` and `VITE_DEMO_MODE=false`. Real API mode is the default, but setting `false` also makes the dev script start the API when `server/.env` is absent. Restart the command after changing environment variables.
5. Optionally run `npm.cmd run data:seed` from the app root to add the example menu and settings to MongoDB. It leaves existing dishes unchanged. Replace all sample content with the client’s restaurant details.

New customer accounts are signed in immediately after registration; email verification is not required. Configure Resend to support password-reset emails.

To provision the first owner account, temporarily set `ADMIN_INITIAL_PASSWORD` in `server/.env` to a unique password of at least 12 characters, then run `npm.cmd run admin:create -- owner@seasoned.com "Owner Name"` from the app root. Remove `ADMIN_INITIAL_PASSWORD` from `.env` after the account is created. The provisioner creates or updates only the specified administrator account; public registrations always receive the customer role.

## Google OAuth

Create a Google OAuth web client and add this authorized redirect URI:

`http://localhost:4000/api/auth/google/callback`

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` in `server/.env`. Put owner emails in the comma-separated `ADMIN_EMAILS` allowlist; other Google accounts become customers. In the project root, set `VITE_GOOGLE_OAUTH_ENABLED=true` and `VITE_DEMO_MODE=false`, then restart Vite. Google sign-in stays unavailable until both sides are configured.

## Production deployment

Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for the Vercel setup, HTTPS, Resend email verification, Atlas backup options, and launch checks. Standard production builds require `VITE_DEMO_MODE=false` and either a same-origin API (`VITE_API_URL=/`) or a real HTTPS API URL; the API validates its required production configuration before startup.

To show an interactive map directly on the Contact page, set `VITE_GOOGLE_MAPS_API_KEY` in the root `.env`. Restrict the key to the Maps Embed API and the deployed website referrers. Without it, the page still links guests to the exact address in Google Maps.
