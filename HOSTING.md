# Publish Apex with email and password login

Status: deployment files prepared; no hosting service or public URL has been created. The Docker configuration has not been built locally. Automated backend tests cover hosted first-owner creation, Secure cookies, disabled public admin registration, and database persistence across restarts.

## Accounts needed

1. A hosting account. The included `render.yaml` targets Render, using a paid web service and persistent disk. Review pricing before authorizing creation. No hosting has been purchased.
2. A Git repository accessible to that account. Keep the source private if desired. Never upload `data`, `.env`, password lists or backups to the repository.
3. For password-reset mail: a Resend account with a verified sending domain. This is separate from login; email/password login does not require access to the user's email inbox or their Gmail password.

## Deployment

Connect the source repository in Render, choose a new Blueprint, and use `render.yaml`. Enter ADMIN_NAME, ADMIN_EMAIL and a unique ADMIN_PASSWORD of 12–128 characters directly in Render's private environment settings. Do not paste credentials into chat or commit them. Review the service and disk price before creating the resources.

On first boot, the server creates your CEO account only if the hosted database is empty. Public admin registration is disabled. Subsequent boots do not overwrite that account. Remove ADMIN_PASSWORD after the first successful sign-in. Render supplies RENDER_EXTERNAL_URL, which the server uses as the HTTPS origin. Do not copy the local APP_URL=http://localhost:4310 setting to hosting.

After deployment succeeds, use the exact HTTPS URL shown in Render. Sign in as the owner. Create an organization, a project and a test employee, assign project access, and sign in as that employee in a separate browser. Restart/redeploy the service and confirm data survives. The persistent disk must remain mounted at /app/data.

This creates a fresh hosted workspace: existing local organizations and accounts are not automatically uploaded. If preserving those records is desired, stop the local app, back up the data folder, and arrange a private database migration before using the online workspace. Never publish a SQLite file as a web asset.

## Connect password recovery

In the service's private environment settings add RESEND_API_KEY and EMAIL_FROM. EMAIL_FROM must use your verified sender, for example Apex Workspace <portal@your-verified-domain>. Restart and test forgot password with an account you control. Follow the received reset link, choose a new password, and confirm the old password and reused link fail.

Email is the login identifier. Passwords are salted hashes in the database; the app does not store readable passwords or email existing passwords. If mail is not configured, recovery reports that explicitly.

## Sharing with employees

Share only the live HTTPS website URL. Each person needs their own application account and assigned project access. Creating a login does not send an invitation email in the current app. The agency-wide employee model and invitation flow discussed earlier still need implementation; current employee accounts are limited to one client organization.

## Launch limits

The existing README's production gaps still apply. Deployment preparation is not a full security audit or proof that email delivery and payments work. No real email was sent and no credentials were transmitted during preparation. This setup uses one server and one SQLite disk; do not scale it to multiple independent instances sharing different databases.

References:
- https://render.com/docs/blueprint-spec
- https://render.com/docs/disks
- https://render.com/docs/docker
- https://resend.com/docs/api-reference/emails/send-email
