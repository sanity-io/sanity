import {definePlugin, defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {LayoutWithOptionsBar} from './options/OptionsBar'
import {optionsTool} from './options/OptionsTool'
import {schemaTypes} from './schemas'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'northfold'

const variants2Options = definePlugin({
  name: 'variants-2-0-options',
  tools: [optionsTool],
  studio: {components: {layout: LayoutWithOptionsBar}},
})

export default defineConfig({
  name: 'default',
  title: 'Variants 2.0 · design studio',
  projectId,
  dataset,
  plugins: [structureTool(), variants2Options()],
  schema: {types: schemaTypes},
  beta: {
    variants: {enabled: true},
  },
})
