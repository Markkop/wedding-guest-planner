# Wedding Guest Planner

Next.js 15 application for collaborative event guest planning. Production runs as a Dockerfile-based Coolify application on the Markkop VPS, with a private Coolify-managed PostgreSQL 17 database.

## Local development

Prerequisites: Node.js 22, pnpm 10.32.1, and Docker.

```bash
cp .env.example .env.local
docker compose up -d postgres
pnpm install
pnpm db:migrate
pnpm dev
```

Set `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and any OpenAI credentials in `.env.local`. The development database is exposed only on `127.0.0.1:54329`.

Create a Google OAuth web client with `http://localhost:3000` as an authorized JavaScript origin and `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. Production uses `https://guests.markkop.dev` and `https://guests.markkop.dev/api/auth/callback/google` respectively.

Quality checks:

```bash
pnpm tsc
pnpm lint
```

Do not run a frontend build unless explicitly requested by the repository owner.

## Database migrations

SQL migrations live in `db/migrations` and are applied in filename order by `pnpm db:migrate`. Applied files are recorded with SHA-256 checksums in `app_schema_migrations`; editing an already-applied migration causes startup to fail. Add a new migration for every schema change.

The production container applies pending migrations before starting Next.js. The `/api/health` endpoint checks both the app and database.

## Production

- URL: `https://guests.markkop.dev`
- Runtime: Coolify Dockerfile application, port 3000
- Database: private Coolify-managed PostgreSQL 17
- Source: Forgejo (`git.markkop.dev`) with GitHub as a secondary remote
- Backups: Coolify native encrypted S3/B2 database backup schedule

See [docs/vps-postgres.md](docs/vps-postgres.md) for migration, verification, backup, and restore operations. Infrastructure desired state is maintained separately in the `vps-ops` repository.
