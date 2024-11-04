import {defineWorkspace} from 'vitest/config'

export default defineWorkspace([
  'packages/@sanity/migrate',
  'packages/@sanity/block-tools',
  'packages/@sanity/cli',
  'packages/@sanity/mutator',
  'packages/@sanity/schema',
  'packages/@sanity/types',
  'packages/@sanity/util',
  'packages/sanity',
])
