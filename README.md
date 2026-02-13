This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase Setup

1. Go to the [Supabase dashboard](https://app.supabase.com), navigate to your project, and open **Settings > API**.
2. Copy the following values:
   - **Project URL**
   - **Anon key** (under `anon` / `public`)
   - **Service Role key** (under `service_role` / `secret` — keep this private)
3. Create a `.env.local` file in the project root (do **not** commit this file):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
4. Run `npm run dev` as normal. The app will connect to the shared Supabase project.

## Testing

### Unit & Integration Tests (Vitest)

Unit tests use [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and jsdom.

```bash
npm test              # Run in watch mode (local dev)
npm run test:run      # Run once and exit
npm run test:coverage # Run with coverage report
```

Test files are **colocated** next to source files using the `*.test.tsx` naming convention:

```
src/
  app/
    page.tsx
    page.test.tsx       ← test lives next to the file it tests
  components/
    Button.tsx
    Button.test.tsx
```

Shared test utilities live in `tests/`:

| File | Purpose |
|------|---------|
| `tests/setup.ts` | Loads jest-dom matchers (`toBeInTheDocument`, etc.) |
| `tests/helpers/render.tsx` | Custom `render()` that wraps components with app providers |
| `tests/helpers/supabase.ts` | Mock factory for Supabase client — use in `vi.mock()` calls |

### E2E Tests (Playwright)

End-to-end tests use [Playwright](https://playwright.dev/) and run against the production build in a real browser.

```bash
npm run test:e2e      # Run headless
npm run test:e2e:ui   # Open interactive UI mode
```

E2E test files live in `e2e/`:

```
e2e/
  home.spec.ts
```

> **First-time setup:** Run `npx playwright install` to download browser binaries before running E2E tests.

Playwright automatically builds and starts the Next.js production server before running tests (configured via `webServer` in `playwright.config.ts`).

### Other Quality Commands

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript type checking (tsc --noEmit)
```

## CI/CD

GitHub Actions runs automatically on every **push** and **pull request** to `main` or `develop`.

The pipeline has 4 jobs:

```
lint-and-typecheck ──→ build ──→ e2e-tests
unit-tests  (runs in parallel, independent)
```

| Job | What it does | Depends on |
|-----|-------------|------------|
| **Lint & Type Check** | `eslint` + `tsc --noEmit` | — |
| **Unit Tests** | `vitest run --coverage`, uploads coverage artifact | — |
| **Build** | `next build`, uploads `.next/` artifact | Lint & Type Check |
| **E2E Tests** | Downloads build artifact, runs Playwright (Chromium only) | Build |

**Required GitHub secrets** (set in repo Settings → Secrets → Actions):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

If you push a new commit while CI is running, the previous run is automatically cancelled.

**Deployment** is handled by Vercel's GitHub integration separately from CI. The CI pipeline validates code quality; Vercel deploys on merge to `main`.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Supabase Documentation](https://supabase.com/docs)
