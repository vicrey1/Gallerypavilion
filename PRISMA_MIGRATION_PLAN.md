Goal: Safely migrate the project to use MongoDB (staged, tested) without touching production until validated.

Overview
- Current `.env` DATABASE_URL points at a MongoDB cluster. We will not push schema to that cluster until staging is validated and backups exist.
- We'll create a staging environment, adapt Prisma schema for MongoDB as needed, test the app's auth/signup flows, then schedule production push with a backup.

Steps
1) Prepare staging environment
   - Create a staging database in your MongoDB cluster or a separate cluster.
   - Copy `.env.staging.example` to `.env.staging` and update `DATABASE_URL` and `MONGODB_URI`.

2) Local safety: set local `.env` to development
   - In your local repo `.env` ensure `NODE_ENV=development`.

3) Validate Prisma schema compatibility
   - Review `prisma/schema.prisma` and remove/adjust SQL-specific constructs (e.g., @@map, some relation annotations) where Prisma Mongo doesn't support them.
   - Consider simplifying relations to embedded documents or references depending on the model.

4) Generate client and push to staging DB
   - Run: `npx prisma generate`
   - Run: `npx prisma db push --schema=prisma/schema.prisma` (this creates collections in staging DB)

5) Start dev server connected to staging
   - Temporarily set environment to use `.env.staging` when running dev or deploy to a staging host with these envs.
   - Start app and run smoke tests: signup, login, basic CRUD.

6) Tests
   - Manual: POST `/api/auth/photographer-signup` with a test user, confirm response 201 and data in DB.
   - Automated: add a minimal integration test that calls the route and asserts created user/photographer.

7) Backup production DB
   - Before touching production, take a mongodump or cloud snapshot.

8) Production rollout
   - After tests pass and backups are taken, run `npx prisma db push --schema=prisma/schema.prisma` against production DATABASE_URL (or deploy the app and let migration run in CI).
   - Monitor logs and health checks.

Commands (PowerShell) - staging push example
```powershell
# Use staging env file for the following
$env:DATABASE_URL='mongodb+srv://username:password@staging-cluster.mongodb.net/stagingdb?retryWrites=true&w=majority'
$env:NODE_ENV='development'
npx prisma generate
npx prisma db push --schema=prisma/schema.prisma
npm run dev
```

Rollback plan
- If something breaks, restore from mongorestore of the snapshot.

Notes & Caveats
- Prisma's MongoDB support differs from SQL: relations and aggregations may behave differently.
- Consider moving heavy relational data to reference collections or use embedded docs where appropriate.
- If you want, I can propose exact schema adjustments to fully support MongoDB relations (I can create a modified `prisma/schema.prisma` for staging).

Next actions I can take for you (pick one)
A) Create a staging-ready `prisma/schema.prisma` (adjust relations/ids) and push to a staging DB you provide.
B) Create automated integration tests for the signup flow and run them against staging.
C) Walk you through backing up production and the exact `prisma db push` steps for production.
