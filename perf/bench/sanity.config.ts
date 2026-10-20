import {defineConfig} from 'sanity'

import {apiConfig} from './studio/apiConfig'
import {arrayI18nWorkspace} from './studio/schemas/arrayI18n'
import {articleWorkspace} from './studio/schemas/article'
import {commentsFieldWorkspace} from './studio/schemas/commentsField'
import {emptyToolWorkspace} from './studio/schemas/emptyTool'
import {recipeWorkspace} from './studio/schemas/recipe'
import {singleStringWorkspace} from './studio/schemas/singleString'
import {structureToolWorkspace} from './studio/schemas/structureTool'
import {syntheticWorkspace} from './studio/schemas/synthetic'

/**
 * The studio under test: one workspace per scenario, each at its own
 * basePath (mirrors dev/efps). Scheduled publishing and releases are
 * disabled — they add background traffic that is out of scope for the
 * benchmarked editing flows.
 */
const common = {
  ...apiConfig,
  scheduledPublishing: {enabled: false},
  releases: {enabled: false},
}

export default defineConfig([
  {
    basePath: '/singleString',
    ...common,
    ...singleStringWorkspace,
  },
  {
    basePath: '/arrayI18n',
    ...common,
    ...arrayI18nWorkspace,
  },
  {
    basePath: '/article',
    ...common,
    ...articleWorkspace,
  },
  {
    basePath: '/recipe',
    ...common,
    ...recipeWorkspace,
  },
  {
    basePath: '/synthetic',
    ...common,
    ...syntheticWorkspace,
  },
  {
    basePath: '/structureTool',
    ...common,
    ...structureToolWorkspace,
  },
  {
    basePath: '/emptyTool',
    ...common,
    ...emptyToolWorkspace,
  },
  {
    basePath: '/commentsField',
    ...common,
    ...commentsFieldWorkspace,
  },
])
