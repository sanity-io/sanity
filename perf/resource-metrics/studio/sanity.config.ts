import {defineConfig} from 'sanity'

import {blog} from './workspaces/blog'
import {largeSchema} from './workspaces/largeSchema'
import {minimal} from './workspaces/minimal'
import {pluginHeavy} from './workspaces/pluginHeavy'

const PROJECT_A = {projectId: 'ppsg7ml5', dataset: 'resource-metrics'}
const PROJECT_B = {projectId: 'q5caobza', dataset: 'resource-metrics'}

const common = {
  scheduledPublishing: {enabled: false},
  releases: {enabled: false},
}

export default defineConfig([
  {
    ...common,
    ...PROJECT_A,
    ...minimal,
    basePath: '/minimal',
  },
  {
    ...common,
    ...PROJECT_A,
    ...blog,
    basePath: '/blog',
  },
  {
    ...common,
    ...PROJECT_B,
    ...largeSchema,
    basePath: '/large-schema',
  },
  {
    ...common,
    ...PROJECT_B,
    ...pluginHeavy,
    basePath: '/plugin-heavy',
  },
])
