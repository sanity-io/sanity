# Perf tracking for studio

Before you can run the perf tests you need to add a session token so the tests are able to log in. See .env.example on the root of this repo for more info about how to set the required `PERF_STUDIO_SANITY_WRITE_TOKEN` and `PERF_TEST_SANITY_TOKEN` environment variables.

Run the perf tests locally:

First, make sure you have the perf studio running:

```
$ yarn perf:studio
```

Once the perf studio is running, you can run the perf tests against it and see how it compares to the current studio. Note: when running on localhost in dev mode, things will naturally be slower than when running against a production build of the studio. Therefore, stats from running perf tests locally will not be submitted to the data store

```
$ yarn perf:test
```

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

- `client`: A sanity client instance
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
