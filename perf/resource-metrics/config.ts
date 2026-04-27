// The perf tests project — shared with perf/tests, but using a separate dataset
// to keep resource metrics isolated from the existing performance test results.
export const METRICS_PROJECT_ID = 'c1zuxvqn'
export const METRICS_DATASET = 'resource-metrics'

// The workspaces defined in studio/sanity.config.ts.
// Each entry maps a workspace name to its basePath and the HAR fixture file used for replay.
export const WORKSPACES = [
  {name: 'minimal', basePath: '/minimal', harFixture: 'minimal.har'},
  {name: 'blog', basePath: '/blog', harFixture: 'blog.har'},
  {name: 'large-schema', basePath: '/large-schema', harFixture: 'large-schema.har'},
  {name: 'plugin-heavy', basePath: '/plugin-heavy', harFixture: 'plugin-heavy.har'},
] as const
