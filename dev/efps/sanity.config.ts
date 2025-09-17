import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {articleEfps} from './tests/article/sanity.config'
import {recipeEfps} from './tests/recipe/sanity.config'
import {syntheticEfps} from './tests/synthetic/sanity.config'
import {singleStringEfps} from './tests/singleString/sanity.config'

export const defaultConfig = defineConfig({
  name: 'default',
  title: 'Studio Performance - efps tests',
  basePath: '/structure',
  projectId: 'b8j69ts2',
  dataset: 'production',
  apiHost: 'https://api.sanity.work',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})

export default defineConfig([
  defaultConfig,
  {...articleEfps, basePath: '/article'},
  {...recipeEfps, basePath: '/recipe'},
  {...syntheticEfps, basePath: '/synthetic'},
  {...singleStringEfps, basePath: '/singleString'},
])
