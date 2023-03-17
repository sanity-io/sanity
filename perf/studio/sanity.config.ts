/// <reference types="vite/client" />
import {defineConfig, PluginOptions} from 'sanity'
import {deskTool} from 'sanity/desk'
import {STUDIO_DATASET, STUDIO_PROJECT_ID} from '../config/constants'
import {simple} from './schema/simple'
import {deepObject} from './schema/deepObject'
import {deepArray} from './schema/deepArray'

export default defineConfig({
  plugins: [
    // For some reason we need the explicit type cast here or else the type checker will fail with
    // TS4082: Default export of the module has or is using private name 'PluginOptions'.
    deskTool() as PluginOptions,
  ],
  title: 'Perf test Studio',
  name: 'default',
  projectId: STUDIO_PROJECT_ID,
  dataset: import.meta.env.SANITY_STUDIO_DATASET || STUDIO_DATASET,
  schema: {types: [simple, deepObject, deepArray]},
})
