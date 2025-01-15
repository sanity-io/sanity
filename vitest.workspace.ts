import {defineWorkspace} from 'vitest/config'

export default defineWorkspace([
  'packages/@sanity/migrate',
  'packages/@sanity/cli',
  'packages/@sanity/codegen',
  'packages/@sanity/mutator',
  'packages/@sanity/schema',
  'packages/@sanity/types',
  'packages/@sanity/util',
  'packages/sanity',
  'packages/sanity/src/_internal/cli',
  'perf/tests',
])
