# Resource Metrics

Collects hard counting metrics from a running Sanity Studio to detect resource regressions across PRs.

## What it measures

| Metric                      | How                                                                                                                                                                                        | Deterministic?                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| **HTTP request count**      | Playwright `page.on('request')` — counts every network request during the scenario                                                                                                         | Yes                                         |
| **HTTP transfer size**      | `Content-Length` response header — actual bytes on the wire                                                                                                                                | ~Yes (small variance from response headers) |
| **DOM node count**          | Chrome DevTools Protocol `Performance.getMetrics` → `Nodes`                                                                                                                                | Yes                                         |
| **JS event listener count** | Chrome DevTools Protocol `Performance.getMetrics` → `JSEventListeners`                                                                                                                     | Yes                                         |
| **JS heap size (retained)** | Chrome DevTools Protocol `HeapProfiler.collectGarbage` (forces garbage collection) then `Runtime.getHeapUsage` — measures what the app is actually holding onto, not transient allocations | ~10% variance                               |

### About the Chrome DevTools Protocol

Several metrics are collected via the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) (CDP). This is the same protocol that Chrome DevTools uses internally — Playwright gives us programmatic access to it via `page.context().newCDPSession(page)`. It lets us query browser internals like heap memory, DOM node counts, and event listener counts that aren't available through regular web APIs.

## How it works

### On PRs

1. Builds the perf studio (`perf/studio`)
2. Serves it locally via `sanity preview`
3. Launches Chromium via Playwright, authenticates, and runs each scenario
4. Collects metrics via request interception and CDP
5. Compares against cached metrics from `main` (stored in GitHub Actions cache)
6. Posts a comparison table as a PR comment (warn only, does not block merge)

### On push to `main`

1. Same build + collect steps
2. Caches the results keyed by commit SHA (for future PR comparisons)
3. Writes metrics to a Sanity dataset (`c1zuxvqn` / `resource-metrics`) for time-series tracking

## Scenarios

- **`studio-boot`** — Navigates to the Studio root and waits for the navbar to appear. Measures the full boot cost: JS bundles loaded, API calls made, DOM constructed.
- **`document-open`** — (Defined but not yet wired up) Navigates to a specific document and waits for the form to be editable.

## Running locally

### Prerequisites

- The perf studio must be built: `pnpm perf:studio:build`
- A Sanity auth token with access to the perf studio project

### Steps

```bash
# Start the perf studio
cd perf/studio && pnpm start &

# Run resource metrics against it
STUDIO_URL=http://localhost:3300 \
RESOURCE_METRICS_STUDIO_TOKEN=<your-token> \
pnpm resource-metrics:test
```

To run headful (visible browser):

```bash
HEADLESS=false STUDIO_URL=http://localhost:3300 \
RESOURCE_METRICS_STUDIO_TOKEN=<your-token> \
pnpm resource-metrics:test
```

### Comparing against a reference

```bash
# First, save a reference run
cp perf/resource-metrics/results/experiment.json perf/resource-metrics/results/reference.json

# Make your changes, rebuild, then run again with comparison
REFERENCE_RESULTS_PATH=perf/resource-metrics/results/reference.json \
STUDIO_URL=http://localhost:3300 \
RESOURCE_METRICS_STUDIO_TOKEN=<your-token> \
pnpm resource-metrics:test
```

## Environment variables

| Variable                        | Required | Description                                                        |
| ------------------------------- | -------- | ------------------------------------------------------------------ |
| `STUDIO_URL`                    | Yes      | URL of the running Studio (e.g. `http://localhost:3300`)           |
| `RESOURCE_METRICS_STUDIO_TOKEN` | Yes      | Sanity auth token for the perf studio project                      |
| `RESOURCE_METRICS_WRITE_TOKEN`  | No       | Token to write metrics to the Sanity dataset (only used on `main`) |
| `REFERENCE_RESULTS_PATH`        | No       | Path to a reference `experiment.json` file for comparison          |
| `HEADLESS`                      | No       | Set to `false` to run with a visible browser. Defaults to `true`   |

## Adding a new scenario

1. Create a new file in `scenarios/` that exports an object satisfying the `Scenario` interface
2. Import and wire it into `index.ts`
3. The `Scenario` interface requires:
   - `name` — identifier used in results and reports
   - `description` — human-readable description
   - `getUrl(baseUrl, ...args)` — returns the URL to navigate to
   - `waitForReady(page)` — waits until the page is in the state you want to measure

## Time-series tracking

On every push to `main`, metrics are written to the Sanity project `c1zuxvqn` in the `resource-metrics` dataset as documents of type `resourceMetrics`. You can query trends with GROQ:

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
