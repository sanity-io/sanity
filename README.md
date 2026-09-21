# Screenshots for sanity-io/sanity#14687

Review material only; this branch is never meant to be merged and can be deleted once the PR is.

`suspense-fallbacks/<scenario>/<side>-<state>.png`

- `side`: `before` = `main` at the PR's merge base, `after` = the PR branch
- `state`: `fallback` = the Suspense fallback while a `lazy()` Components API component loads,
  `loaded` = the same view after the import resolved and React removed the fallback

Captured in `dev/test-studio` with a local plugin that turns one middleware kind into `lazy()` and
either never resolves it (`fallback`) or resolves it after 1.5s (`loaded`).
