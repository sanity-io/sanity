import {apiConfig} from './apiConfig'
import {articleEfps} from './tests/article/sanity.config'
import {recipeEfps} from './tests/recipe/sanity.config'
import {singleStringEfps} from './tests/singleString/sanity.config'
import {syntheticEfps} from './tests/synthetic/sanity.config'
import {defineConfig} from 'sanity'

const common = {
  ...apiConfig,
  scheduledPublishing: {
    enabled: false,
  },
  releases: {
    enabled: false,
  },
}

export default defineConfig([
  {
    basePath: '/article',
    ...common,
    ...articleEfps,
  },
  {
    basePath: '/recipe',
    ...common,
    ...recipeEfps,
  },
  {
    basePath: '/synthetic',
    ...common,
    ...syntheticEfps,
  },
  {
    basePath: '/singleString',
    ...common,
    ...singleStringEfps,
  },
])
