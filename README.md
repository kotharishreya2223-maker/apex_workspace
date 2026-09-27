# Apex Workspace — running and operating your client portal

This is a working local MVP rebuilt from your previous Apex HTML pages. Your Desktop originals were not modified. The new project lives in `C:\Users\shrey\OneDrive\Documents\ChatGPT\CLIENT PORTAL`.

It has a real Node.js server, SQLite database, server-checked permissions, and a responsive interface. It is not yet the complete production implementation of every technical detail in your twelve-module specification. The matrix below distinguishes what works now from what still needs work. The first eight modules are the implemented scope; modules 9–12 are future expansion, though a basic overview and activity feed are included.

## 1. Run it on your computer

Node.js 22.19 or newer is required. Your computer already has a compatible version. There are no npm dependencies to install.

Open PowerShell and run:

```powershell
Set-Location 'C:\Users\shrey\OneDrive\Documents\ChatGPT\CLIENT PORTAL'
npm.cmd start
```

Open http://localhost:4310 in a browser. Keep the terminal running. Stop with Ctrl+C. To run again, use the same commands; your data survives restarts. Port 4310 avoids another application already using localhost:3000 on this computer.

Do not double-click index.html. The frontend needs the server for authentication and database access. Do not use VS Code Live Server for this project.

For configuration, copy `.env.example` to `.env` once:

```powershell
Copy-Item .env.example .env
```

Edit `.env`, then restart the server. Never commit or share this file after adding API keys. `npm.cmd` avoids Windows PowerShell restrictions on the npm.ps1 wrapper.

## 2. Your super admin email and password

There is deliberately no shared default admin password. On the first screen, enter your name, your own email, and a new password of at least 12 characters. A long unique passphrase saved in a password manager is suitable. These become your real super admin credentials. The email is not verified automatically during local setup.

The original script exposed a password in frontend source and displayed staff passwords in a table. Treat that old password as exposed and do not reuse it here or on other accounts. The new app stores salted scrypt hashes, never retrievable plaintext passwords.

First-admin setup works only when the request reaches the server from loopback and only while no user exists. Complete this locally before configuring a public reverse proxy; never expose an uninitialized instance. After setup, login roles come from the database, not a role dropdown or browser localStorage.

Sessions last eight hours and use an HttpOnly, SameSite=Strict cookie. In production the cookie also uses Secure. Password reset invalidates existing sessions. This implementation uses opaque server-side sessions rather than JWT; both require server-side access control, and session revocation is straightforward here.

## 3. The first eight modules and where they are

| # | Module | Sidebar location | Working now | Remaining / different from your specification |
|---|---|---|---|---|
| 1 | Multi-tenant organization & white-labeling | Organizations | Separate organizations, projects, custom organization logo, primary color, organization-scoped access | Secondary color, custom subdomain routing and DNS/SSL provisioning are not implemented. Stored subdomain is only a preference. One organization per non-admin user in this version. |
| 2 | Fine-grained RBAC | Team & access | Super admin, manager, designer/developer staff and client roles; explicit project assignments; backend permission checks | Uses server sessions rather than JWT. No granular custom permission editor, account deactivation, access revocation UI, MFA, or self-service invitation flow yet. |
| 3 | Kanban tasks & milestones | Task board | Create tasks, milestone flags, due dates, four stages, drag-and-drop plus keyboard-accessible status select | Native drag/drop rather than React library; no task assignee editor, dependency engine or advanced milestone entity. |
| 4 | Document vault & sign-off | Document vault | Private PNG/JPEG/WebP/PDF files, title-based versions, approval identity and timestamp | Files stored in SQLite locally, not S3/Firebase. Approval is an acknowledgement record, not a certificate-backed signature platform. No malware scanning or retention policy yet. |
| 5 | Visual feedback & revisions | Feedback | Click image coordinates, add pinned comments, automatically create revision tasks | Image annotation only; PDF page overlays, resolved-thread states and wireframe integrations are not implemented. |
| 6 | Discussion hub | Discussions | Persistent project messages, private staff messages, five-second refresh | Polling rather than Socket.io; plain text only, no rich text, mention notifications or inline attachments yet. Upload attachments through the vault. |
| 7 | Time & unbilled hours | Time tracking | Start/stop timer, manual hours, billable checkbox, rate per entry, unbilled/invoiced status | Timer stays only in the current page session; refresh loses a running timer. Save entries promptly. No predefined staff-rate catalog yet. |
| 8 | Invoices & payments | Invoices | Convert unbilled hours to invoice, INR totals, printable invoice, Stripe Checkout adapter and signed payment webhook | Browser Print → Save as PDF rather than backend PDFKit; no fixed-price milestones, taxes, refunds, invoice numbering policy or Razorpay adapter yet. Live payments require a configured eligible Stripe account and verification. |

The **Setup guide** sidebar repeats this map inside the app. The **Overview** shows metrics for the selected project, not agency-wide totals. The project selector at the top changes context for every project module.

## 4. Set up a real client from beginning to end

1. Sign in as the super admin.
2. Open Organizations → New organization. Enter the client business name and brand color. Optionally upload a logo up to 500 KB. A new Apex vector logo is included; your old logo is preserved at `public/original-logo.png` if you prefer to upload it.
3. Add a project from the organization card or Overview. Select the correct organization and describe the campaign.
4. Open Team & access → Add team member. Create a project manager, designer/developer, and client user as needed. Give each a unique password and the correct organization. Passwords cannot be viewed afterwards. This local version does not email invitations or require a password change at first login.
5. Select a project in the top dropdown. Open Team & access → Assign project access. Select the member. Creating a user alone does not grant project access. Users cannot be assigned across organizations.
6. Test the client login in a separate browser profile. The client should only see assigned projects and shared content. Keep the admin session separate.
7. Create campaign tasks in Task board. Check Internal team only for work clients must not see. Use milestones for approval checkpoints. Move work from Backlog to In Progress to Client Review. Clients can approve a shared task only when it is in Client Review.
8. Upload a deliverable in Document vault. Reuse exactly the same document title for a new version. Each upload is retained separately. Files are limited to 5 MB.
9. Have the client open Feedback and click a draft image. Their note is saved at normalized X/Y coordinates and creates a Backlog revision task. Revisions on internal files remain internal.
10. After reviewing the exact file version, the client chooses Sign & approve and confirms the acknowledgement. The record stores their account identity, email and timestamp. Do not represent this as an independently verified legal signature.
11. Use Discussions for project updates. Staff can mark a message internal. Clients cannot create or read internal messages.
12. Staff log hours and rates. Tick Billable when applicable. Stop a timer in the same project in which it began. Entries must be more than zero and no more than 24 hours.
13. The manager or admin generates an invoice from all currently unbilled billable entries. Included entries become invoiced in a database transaction, preventing them being included twice. Amounts are stored in integer paise. The generated invoice has no tax calculation.
14. Open View invoice, then Print / Save PDF. Review the invoice before sending it outside the portal.
15. Once Stripe is configured, the client can choose Pay. A signed Stripe webhook, not the browser return URL, marks the invoice Paid.

## 5. Email-based forgot password

Recovery uses a new one-time token, not an email containing the old password. Tokens expire after 30 minutes and are stored as hashes. Password reset revokes existing sessions and consumes the reset token.

Configure a Resend account and verify a sending domain. Add these server-only values to `.env`:

```dotenv
APP_URL=https://portal.your-domain.example
RESEND_API_KEY=your_actual_resend_key
EMAIL_FROM=Apex Workspace <portal@your-verified-domain.example>
```

Use the real HTTPS portal URL when deployed; localhost links cannot be used by remote clients. For local tests keep APP_URL=http://localhost:4310. Restart after configuration. Test with an account you control, confirm receipt, follow the link, and confirm that the link cannot be reused.

If email is unconfigured, the website explicitly says recovery is unavailable. It does not pretend a message was sent. Delivery failures are logged on the server by status code. The public response stays generic to reduce account enumeration; therefore a successful request does not prove delivery. Inspect Resend delivery status when investigating missing emails.

Reference: https://resend.com/docs/api-reference/emails/send-email

SMS is not implemented. Adding it requires a provider, verified phone ownership, OTP expiry and retry limits, abuse controls, and a recovery policy. Email recovery satisfies the alternative you requested without collecting phone numbers unnecessarily.

## 6. Connect payments and test them

Create or use your business's eligible Stripe account. Start with test keys. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to `.env`. Never put a secret key in public/app.js.

Register the public HTTPS endpoint `/api/stripe/webhook` in Stripe for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Use the signing secret for that specific endpoint. Local webhook testing requires Stripe's official forwarding tooling; a provider cannot call your localhost directly.

The server creates an INR Checkout Session with the invoice amount and ID. The webhook checks its HMAC signature, timestamp, payment status, currency and amount before updating the invoice. Repeated deliveries do not add another invoice or charge; the same invoice remains Paid. There is no refund or chargeback workflow in this version.

Test the complete sequence in test mode: create time entries, generate invoice, pay at Checkout, receive the webhook, then reopen Invoices and confirm Paid. Also test cancellation. A success URL alone must never be treated as proof of payment. Do not switch to live keys before doing this. Avoid simultaneous multiple checkouts for the same invoice; prevention of concurrent duplicate payment sessions is still a production task.

References: https://docs.stripe.com/api/checkout/sessions/create and https://docs.stripe.com/webhooks/signatures

## 7. What data is stored and who can see it

The database is `data/portal.sqlite`. SQLite creates companion WAL/SHM files while running. Tables:

- users: names, emails, password hashes, roles, organization IDs.
- orgs: organization names, brand color, optional logo data and preferred subdomain.
- projects and members: project metadata and explicit user assignments.
- records: tasks, messages, documents, feedback, time entries, invoices; structured JSON inside indexed-by-ID rows.
- files: uploaded binary file content and MIME type, linked to document records.
- sessions and resets: hashes of tokens and expiry times.
- visits: successful authenticated sign-ins, user IDs and timestamps.
- audit: actor, project, action and timestamp.
- limits: throttling counters for login and recovery requests.

Visitor activity is admin-only and shows up to 100 recent successful sign-ins. It does not identify anonymous visitors, record screens, collect visitor phone numbers, track every page view, or claim employees are online. A person browsing anonymously cannot reliably be named without identifying themselves. If you later add analytics, define the purpose, retention, and user-facing privacy notice first.

There is no database administration web page. Use a SQLite database viewer locally when needed. Do not publish the database, `.env`, or source credentials. `public/` files are served from an explicit allowlist; `data/` is not a public route. Clients cannot use guessed record IDs to access another project.

The activity log is useful operational history, but is not immutable: a server/database administrator can edit it. A production tamper-resistant audit system remains future work.

## 8. Back up and restore

For this small local installation, stop the app before backing up. Copy the entire `data` folder to a secure backup location. Store configuration secrets separately and securely. Restart after copying. Do not copy only the .sqlite file while the process is writing; recent writes can be in the WAL file.

To restore, stop the app, retain a copy of the current data directory, replace it with the backup, and restart. Verify users, projects, files and invoices. Test restores periodically. Your working folder is under OneDrive: avoid simultaneous use of the same database on multiple computers. For deployment, use a local persistent server disk rather than a cloud-sync folder.

## 9. Architecture and request flow

Browser → same-origin REST API → session lookup → role/project authorization → SQLite → response.

The frontend is plain JavaScript and CSS, which keeps local installation simple. The backend uses Node's HTTP server, crypto library, and SQLite integration. The SQLite API in Node 22 may print an experimental warning; that is expected for this runtime. Authentication, authorization, rate limits, file access and invoice calculations run on the backend rather than trusting browser fields.

Every non-admin is restricted to their organization and explicitly assigned projects. Admin can see all organizations. Managers and staff can work in assigned projects; managers additionally generate invoices. This implementation does not yet support one staff account working across several client organizations. That requires a separate agency membership model and cross-organization assignment policy.

Source map:

- server.js — HTTP routes, schema, authentication, permissions and provider adapters.
- public/index.html — frontend entry.
- public/app.js — views, forms, board interactions and API calls.
- public/style.css — responsive layout and branding.
- public/logo.svg — new default Apex logo.
- public/original-logo.png — preserved original logo.
- tests/portal.test.js — isolated integration workflow and security checks.
- .env.example — configuration template.

## 10. Before making this public

This is a local MVP, not a completed production launch. Public hosting was not configured or purchased. Email delivery and Stripe transactions were not tested against real provider accounts because no keys were supplied.

A production implementation should complete the missing items in the module matrix, plus: user invitation and email verification, MFA for admins, password/account management, member removal and deactivation, durable timers, structured task assignments, upload content validation and malware scanning, object storage and size quotas, dependable email queues/retries, payment-session idempotency and reconciliation, tax and invoice policies, monitoring, accessibility and browser coverage, backup automation and retention controls. Conduct a security review before accepting real client files or payments.

For an initial single-server deployment, use a persistent disk, a supported Node runtime, process supervision, HTTPS reverse proxy, and an initialized database. Keep the Node listener on loopback behind the proxy. Set APP_URL to the exact public HTTPS origin and NODE_ENV=production so cookies are Secure. Backups and logs must be protected. Do not expose first-admin setup behind a proxy while the database is empty. For higher scale, migrate to PostgreSQL and object storage rather than sharing a SQLite file across servers.

Custom subdomains require DNS records, TLS certificates, verified ownership, host-to-organization mapping and authorization tests. Entering a preferred subdomain in Organizations does not perform any of those steps.

## 11. Verification and troubleshooting

Run `npm.cmd test`. It uses a temporary database and local port 3127, leaving your real portal data untouched. It covers setup, login, organization membership, role restrictions, private-content filtering, image-feedback revision creation, approvals, billable invoice totals, duplicate invoicing prevention, unconfigured provider errors, cross-origin rejection, and logout. These are integration checks; they do not verify actual email delivery, actual payments, all browsers, or load capacity.

If the page is unavailable: confirm the terminal is running, open exactly http://localhost:4310, and inspect its error output. If the port is busy, change PORT and APP_URL together in .env, then restart. A mismatched APP_URL can cause an Origin rejected response on forms.

If a user sees no projects: check both their organization and explicit project assignment. If a file is missing for a client: check whether it is internal. If invoice generation says no unbilled hours: create a billable time entry with a positive rate; invoiced entries cannot be reused. If password recovery is unavailable: configure both Resend key and sender, then restart.

## 12. Your remaining phases

Module 9: Gantt dependencies and timeline visualization.
Module 10: queued email/push notification engine, mentions and approval alerts.
Module 11: full client executive charts, burn rate, deadlines and financial analytics.
Module 12: tamper-resistant, indexed audit history with retention and export policy.

These are not represented as finished merely because this version includes an overview or a small activity feed.
