# Resource Metrics

Collects hard counting metrics from a running Sanity Studio to detect resource regressions across PRs.

Uses **HAR (HTTP Archive) replay** so that all API responses are served from checked-in fixture files. This makes the tests fully deterministic and requires **zero authentication in CI**.

## What it measures

| Metric | How | Deterministic? |
| --- | --- | --- |
| **HTTP request count** | Playwright `page.on('request')` — counts every network request during the scenario | Yes |
| **HTTP transfer size** | `Content-Length` response header — actual bytes on the wire | Yes (with HAR replay) |
| **DOM node count** | Chrome DevTools Protocol `Performance.getMetrics` → `Nodes` | Yes |
| **JS event listener count** | Chrome DevTools Protocol `Performance.getMetrics` → `JSEventListeners` | Yes |
| **JS heap size (retained)** | Chrome DevTools Protocol `HeapProfiler.collectGarbage` then `Runtime.getHeapUsage` | ~10% variance |

### About the Chrome DevTools Protocol

Several metrics are collected via the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) (CDP). This is the same protocol that Chrome DevTools uses internally — Playwright gives us programmatic access to it via `page.context().newCDPSession(page)`. It lets us query browser internals like heap memory, DOM node counts, and event listener counts that aren't available through regular web APIs.

## Workspaces

The suite runs a dedicated Studio (`perf/resource-metrics/studio/`) with 4 workspaces across 2 projects:

| Workspace | Project | Schema | Purpose |
| --- | --- | --- | --- |
| `minimal` | A | 1 string field | Baseline — the floor for HTTP requests, DOM nodes |
| `blog` | A | post, author, category with references | Typical real-world schema |
| `large-schema` | B | 25 document types with deep nesting | Stress test for schema complexity |
| `plugin-heavy` | B | Minimal schema, structureTool + visionTool | Isolates plugin overhead |

## How it works

### HAR replay

All API responses are served from `.har` files in `fixtures/`. These files are recorded once against real Sanity projects, scrubbed of auth tokens, and committed to the repo. In CI, Playwright's `page.routeFromHAR()` intercepts all API requests and serves the recorded responses.

### On PRs

1. Builds the resource-metrics Studio from source
2. Serves it locally via `sanity preview`
3. For each workspace: launches Chromium, sets up HAR replay, navigates, collects metrics
4. Compares against cached metrics from `main` (stored in GitHub Actions cache)
5. Posts a comparison table as a PR comment (warn only, does not block merge)

### On push to `main`

1. Same build + collect steps
2. Caches the results keyed by commit SHA (for future PR comparisons)
3. Writes metrics to a Sanity dataset (`c1zuxvqn` / `resource-metrics`) for time-series tracking

## Recording HAR fixtures

HAR fixtures need to be recorded once against real Sanity projects. When the Studio's API interactions change significantly (new endpoints, changed auth flow, etc.), re-record them.

### Prerequisites

1. Two Sanity projects with some test data
2. Auth tokens for both projects
3. Build the resource-metrics studio with real project IDs:

```bash
cd perf/resource-metrics/studio
SANITY_STUDIO_PROJECT_A_ID=<real-id-a> \
SANITY_STUDIO_PROJECT_B_ID=<real-id-b> \
SANITY_STUDIO_DATASET=<dataset> \
pnpm build
```

4. Start the studio:

```bash
pnpm start
```

### Record

In a separate terminal:

```bash
pnpm resource-metrics:record -- \
  --project-a-id=<real-id-a> --project-a-token=<token-a> \
  --project-b-id=<real-id-b> --project-b-token=<token-b>
```

This will:
1. Navigate to each workspace in a real browser
2. Wait for the Studio to fully load and settle
3. Save the recorded API responses as `.har` files in `fixtures/`
4. Scrub auth tokens from the HAR files

Commit the resulting `fixtures/*.har` files to the repo.

## Running locally

### With HAR replay (no auth needed)

```bash
# Build the studio (placeholder project IDs are fine with HAR replay)
cd perf/resource-metrics/studio && pnpm build && pnpm start &

# Run metrics
pnpm resource-metrics:test
```

### Without HAR (against real projects)

```bash
# Build and start with real project IDs
cd perf/resource-metrics/studio
SANITY_STUDIO_PROJECT_A_ID=<id> SANITY_STUDIO_PROJECT_B_ID=<id> pnpm build
pnpm start &

# Run (without HAR fixtures, the Studio will make real API calls)
STUDIO_URL=http://localhost:3400 pnpm resource-metrics:test
```

### Comparing against a reference

```bash
# Save a reference run
cp perf/resource-metrics/results/experiment.json perf/resource-metrics/results/reference.json

# Make changes, rebuild, then run again with comparison
REFERENCE_RESULTS_PATH=perf/resource-metrics/results/reference.json \
pnpm resource-metrics:test
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `STUDIO_URL` | No | URL of the running Studio. Defaults to `http://localhost:3400` |
| `RESOURCE_METRICS_WRITE_TOKEN` | No | Token to write metrics to the Sanity dataset (only used on `main`) |
| `REFERENCE_RESULTS_PATH` | No | Path to a reference `experiment.json` file for comparison |
| `HEADLESS` | No | Set to `false` to run with a visible browser. Defaults to `true` |

## Adding a new workspace

1. Create the workspace config in `studio/workspaces/`
2. Add it to `studio/sanity.config.ts`
3. Add an entry to `WORKSPACES` in `config.ts`
4. Record a HAR fixture for it: `pnpm resource-metrics:record -- ...`
5. Commit the new `.har` file

## Time-series tracking

On every push to `main`, metrics are written to the Sanity project `c1zuxvqn` in the `resource-metrics` dataset as documents of type `resourceMetrics`. Query trends with GROQ:

```groq
*[_type == "resourceMetrics"] | order(timestamp desc) {
  commitSha,
  timestamp,
  scenarios[] {
    name,
    metrics
  }
}
```
