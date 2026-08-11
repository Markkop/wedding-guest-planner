# VPS PostgreSQL operations

Production uses an independent Coolify Application and Coolify-managed PostgreSQL resource. Both are attached to Coolify's private Docker network. PostgreSQL has no host port and must not be exposed publicly.

## Runtime configuration

Coolify owns the secrets. The application needs:

- `DATABASE_URL`: private PostgreSQL URL supplied by the managed database
- `DATABASE_SSL=false`: private Docker-network connections do not use TLS
- `DATABASE_POOL_MAX=10`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (also available at build time)
- `OPENAI_API_KEY`

Deployments clone `main` from Forgejo and build the root `Dockerfile`. The image runs migrations before `server.js`; a failed migration prevents an unhealthy release from replacing the active one.

## Neon import procedure

1. Stop or do not start the target application so it cannot write during import.
2. Use the direct Neon endpoint—not the `-pooler` endpoint—for `pg_dump`.
3. Create a PostgreSQL custom-format dump with `--no-owner --no-acl`.
4. Restore into the empty managed database using `pg_restore --clean --if-exists --no-owner --no-acl`.
5. Exclude Neon-owned schemas such as `neon_auth`; only application schema/data belong in the target.
6. Compare table row counts, constraints/indexes, and a deterministic public-schema fingerprint.
7. Start the application. It records the baseline migrations without changing imported tables and applies any future migrations.

Never print connection URLs or database passwords into logs, commits, or shell history.

Run `scripts/verify-database.sql` against both endpoints to produce deterministic
row counts, per-table content digests, and a schema fingerprint without printing
guest or account data. The output must match exactly.

## Verification gates

Before retiring the old providers, verify all of the following:

- `https://guests.markkop.dev/api/health` returns HTTP 200 and `{"status":"ok"}`.
- The TLS certificate is trusted and the hostname redirects HTTP to HTTPS.
- Production counts match the source: users, organizations, organization members, guests, event presets, and active sessions.
- Foreign keys, unique constraints, indexes, and the schema fingerprint match the source.
- Clerk sign-in and an authenticated organization/guest read work.
- A native B2 backup completes successfully.
- A restore drill into a disposable PostgreSQL database produces the same row counts and schema fingerprint.

Only after every gate succeeds should Vercel and the Neon project be deleted.

## Backups and restore

The `vps-ops` desired state assigns this database a dedicated daily/weekly/monthly native Coolify backup schedule and retention. Backups go to the encrypted Backblaze B2 destination already configured on the VPS.

For a restore drill, create a temporary private PostgreSQL resource/database, restore the chosen custom dump through `pg_restore`, run the verification queries, then delete the disposable resource. Do not test restores over the production database.

Application configuration and schedules are audited with `coolify-infra audit`; host-level coverage is audited with `vps-backup audit`.
