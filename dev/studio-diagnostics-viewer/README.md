# Studio diagnostics viewer

A client-only viewer for JSON copied from the Sanity Studio diagnostics panel. Pasted diagnostics stay in the browser and are not uploaded.

```bash
pnpm dev:studio-diagnostics
pnpm build:studio-diagnostics
```

The included `vercel.json` builds the workspace package and serves the Vite SPA with history
fallback. It does not create the Vercel project.

For the one-time setup, create a project under the `sanity-sandbox` Vercel team, connect it to this
repository, and use `dev/studio-diagnostics-viewer` as its Root Directory. Once connected, the
Vercel Git integration creates PR previews and deploys `main` to production.
