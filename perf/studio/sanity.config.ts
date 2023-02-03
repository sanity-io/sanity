import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {simple} from './schema/simple'
import {deepObject} from './schema/deepObject'
import {deepArray} from './schema/deepArray'

type FIXME = any
export default defineConfig({
  plugins: [deskTool() as FIXME /* 🤷 */],
  title: 'Perf test Studio',
  name: 'default',
  projectId: 'qk0wb6qx',
  dataset: 'test',
  schema: {types: [simple, deepObject, deepArray]},
})
