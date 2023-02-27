# Perf tracking for studio

## Overview

- **Perf Studio** - (`perf/studio`) this is the Sanity Studio that we run the test suite against (using playwright). This studio is set up to capture various cases that we want to measure performance of (e.g. a very large document)
- **Performance Test Runner** (`perf/runner.ts`) - this is the node script that sets up the required config, identifies the set of performance tests to run, instantiates a playwright instance that navigates to the set of perf studio deployments (urls), runs each defined performance test against each deployment and compares the difference.  
- Performance test helpers - (`perf/helpers`) A set of performance test helpers that will be injected into the Performance Studio and exposed on `window.perf`.

## Prerequisites
Before you can run the perf tests you need to add a session token so the tests are able to log in. See .env.example on the root of this repo for more info about how to set the required `PERF_STUDIO_SANITY_WRITE_TOKEN` and `PERF_TEST_SANITY_TOKEN` environment variables.

# Run the perf tests locally

Run the perf tests against the perf studio locally to see how it compares to the current `next`-build of the same studio:

```
$ yarn perf:test
```
This will build the perf studio and run it in preview mode locally and run each test defined in the `perf/tests`-folder against it.

## How to add a new perf test

Create a new test file in `perf/tests` with the following template:

```js
export default {
  name: 'Simple typing speed test',
  run: (context: PerformanceTestContext) => Promise<PerformanceSummary> {
    // Do stuff here
    return {result: 9.2}
  }
} satisfies PerformanceTestProps
```

Now you have the basic structure of a perf test. The `run` function will be called with a `PerformanceTestContext` object that contains the following properties:

- `client`: A Sanity client instance for the performance studio dataset 
- `page`: Page object from playwright
- `url`: The url to the perf studio instance

### Performance tests best practices

- Be a good citizen and make sure to delete any documents created during the test
- Rely on test helpers for measurements: The test runner is running in a different process/execution context than the browser instance that playwright is running.

  **Don't:**

  ```ts
  const start = performance.now()
  await input.evaluate((el: HTMLInputElement) => {
    // do something
  })
  const end = performance.now()
  const duration = end - start
  ```

  **Do:**
  ```ts
  const duration = await input.evaluate((element: HTMLInputElement) => {

    const start = performance.now()
    // do something with the element
    const end = performance.now()
    return end - start
  })
  
  ```
