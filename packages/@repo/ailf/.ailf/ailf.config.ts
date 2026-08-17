import {defineRepoConfig} from '@sanity/ailf'

export default defineRepoConfig({
  source: 'production',
  owner: {
    team: 'studio',
  },
  taskSource: {
    type: 'repo',
  },
  triggers: {
    // On pull requests: just validate task files parse correctly.
    'pr': {
      mode: 'validate-only',
    },
    // When `@repo/ailf` files change in a PR: run a real evaluation.
    'pr-task-change': {
      mode: 'eval',
      paths: ['packages/@repo/ailf/**'],
    },
    // On merge to main: run evaluation (non-blocking).
    'main': {
      mode: 'eval',
      blocking: false,
      notify: true,
    },
  },
})
