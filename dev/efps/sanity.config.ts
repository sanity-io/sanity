import {defineConfig} from 'sanity'

import {articleEfps} from './tests/article/sanity.config'
import {recipeEfps} from './tests/recipe/sanity.config'
import {singleStringEfps} from './tests/singleString/sanity.config'
import {syntheticEfps} from './tests/synthetic/sanity.config'

export default defineConfig([
  {...articleEfps, basePath: '/article'},
  {...recipeEfps, basePath: '/recipe'},
  {...syntheticEfps, basePath: '/synthetic'},
  {...singleStringEfps, basePath: '/singleString'},
])
