# TODO — Run Full Stack End-to-End

## Goal
Run the entire Platform LMS stack (API + Web) in development mode against the remote Neon
PostgreSQL, verify authentication and API/Web communication, run the API test script and fix
failures, then prepare the project for production (Railway) deployment.

## Steps
- [x] 1. Analyze project structure & config
- [x] 2. Install dependencies (pnpm install) — node_modules already present
- [x] 3. Generate Prisma client (pnpm db:generate)
- [x] 4. Run Prisma migrations (pnpm db:migrate)
- [x] 5. Seed the Neon database (pnpm db:seed)
- [x] 6. Start NestJS API in dev mode (port 4000) — running via node dist/main.js
- [x] 7. Start Next.js web app in dev mode (port 3000)
- [x] 8. Verify API health, DB connectivity, authentication, API/Web communication
- [x] 9. Run test-api.ps1 and fix failures automatically — ALL PASSED
- [x] 10. Continue fixing until API & Web are fully functional — DONE
- [ ] 11. Production prep: build all, migrate deploy, verify prod startup
- [ ] 12. Ensure Railway deployment readiness
