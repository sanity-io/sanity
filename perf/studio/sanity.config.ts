import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {STUDIO_DATASET, STUDIO_PROJECT_ID} from '../config'
import {simple} from './schema/simple'
import {deepObject} from './schema/deepObject'
import {deepArray} from './schema/deepArray'

type FIXME = any
export default defineConfig({
  plugins: [deskTool() as FIXME /* 🤷 */],
  title: 'Perf test Studio',
  name: 'default',
  projectId: STUDIO_PROJECT_ID,
  dataset: STUDIO_DATASET,
  schema: {types: [simple, deepObject, deepArray]},
})
