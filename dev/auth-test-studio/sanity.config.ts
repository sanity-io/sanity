import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

const USE_STAGING = true

const STAGING = {
  projectId: 'exx11uqh',
  dataset: 'playground',
  apiHost: 'https://api.sanity.work',
}

const PRODUCTION = {
  projectId: 'ppsg7ml5',
  dataset: 'test',
}

export const apiConfig = USE_STAGING ? STAGING : PRODUCTION

export default defineConfig({
  plugins: [structureTool()],
  name: 'default',
  title: 'Auth testing Studio',
  ...apiConfig,
  auth: {
    loginMethod: 'dual',
  },
  schema: {
    types: [{type: 'document', name: 'empty', fields: [{type: 'string', name: 'title'}]}],
  },
})
