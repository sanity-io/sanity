# Editor "Frames per Second" — eFPS benchmarks

This folder contains a performance test suite for benchmarking the Sanity Studio editor and ensuring smooth performance. The suite is designed to run various tests and measure the editor's performance using the eFPS (editor Frames Per Second) metric.

## Overview

The performance test suite is part of the Sanity Studio monorepo and is used to benchmark the editor's performance. It runs a series of tests on different document types and field configurations to measure the responsiveness and smoothness of the editing experience.

## eFPS Metric

The eFPS (editor Frames Per Second) metric is used to quantify the performance of the Sanity Studio editor. Here's how it works:

1. The test suite measures the time it takes for the editor to respond to user input (e.g., typing in a field).
2. This response time is then converted into a "frames per second" analogy to provide an intuitive understanding of performance.
3. The eFPS is calculated as: `eFPS = 1000 / responseTime`

We use the "frames per second" analogy because it helps us have a better intuition for what constitutes good or bad performance. Just like in video games or animations:

- Higher eFPS values indicate smoother, more responsive performance.
- Lower eFPS values suggest lag or sluggishness in the editor.

For example:

- An eFPS of 60 or higher is generally considered very smooth.
- An eFPS between 30-60 is acceptable but may show some lag.
- An eFPS below 30 indicates noticeable performance issues.

## Percentiles

The test suite reports eFPS values at different percentiles (p50, p75, and p90) for each run. Here's why we use percentiles and what they tell us:

- **p50 (50th percentile or median)**: This represents the typical performance. Half of the interactions were faster than this, and half were slower.
- **p75 (75th percentile)**: 75% of interactions were faster than this value. It gives us an idea of performance during slightly worse conditions.
- **p90 (90th percentile)**: 90% of interactions were faster than this value. This helps us understand performance during more challenging scenarios or edge cases.

Using percentiles allows us to:

1. Get a more comprehensive view of performance across various conditions.
2. Identify inconsistencies or outliers in performance.
3. Ensure that we're not just optimizing for average cases but also for worst-case scenarios.

## Test Structure

Each test in the suite has its own build. This approach offers several advantages:

1. **Isolation**: Each test has its own schema and configuration, preventing interference between tests.
2. **Ease of Adding Tests**: New tests can be added without affecting existing ones, making the suite more modular and maintainable.
3. **Accurate Profiling**: Individual builds allow for more precise source maps, which leads to better profiling output and easier performance debugging.

## Debugging
### Locally

Running the tests with the `HEADLESS` environment variable set to `false` will open Chrome and show you the tests as they are being executed.

```bash
HEADLESS=false pnpm run efps:test
```

### On CI
The eFPS GitHub workflow has a manual dispatch where you can run it from a selected branch and enable “Record video”. This adds screen recordings for the failing tests as artifacts on the workflow run which can be useful when debugging issues that may only happen on CI.

Run a manual dispatch here: https://github.com/sanity-io/sanity/actions/workflows/efps.yml


## Adding a New Test

To add a new test to the suite:

1. Create a new folder in the `tests` directory with your test name.
2. Create the following files in your test folder:
   - `sanity.config.ts`: Define the Sanity configuration for your test.
   - `sanity.types.ts`: Define TypeScript types for your schema (if needed).
   - `<testname>.ts`: Implement your test using the `defineEfpsTest` function.
3. If your test requires assets, add them to an `assets` subfolder.
4. Update the `tests` array in `index.ts` to include your new test.

Example structure for a new test:

```
tests/
  newtest/
    assets/
    sanity.config.ts
    sanity.types.ts
    newtest.ts
```

## CPU Profiles

The test suite generates CPU profiles for each test run. These profiles are remapped to the original source code, making them easier to analyze. To inspect a CPU profile:

1. Open Google Chrome DevTools.
2. Go to the "Performance" tab.
3. Click on "Load profile" and select the `.cpuprofile` file from the `results` directory.

The mapped CPU profiles allow you to:

- Identify performance bottlenecks in the original source code.
- Analyze the time spent in different functions and components.
- Optimize the areas of code that have the most significant impact on performance.
