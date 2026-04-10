import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

const USE_STAGING = false

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

const shared = {
  ...apiConfig,
  plugins: [structureTool()],
  schema: {
    types: [
      {
        type: 'document',
        name: 'empty',
        fields: [{type: 'string', name: 'title'}],
      },
    ],
  },
}

export default defineConfig([
  {
    ...shared,
    name: 'cookie',
    title: 'Cookie Auth Studio',
    basePath: '/cookie',
    auth: {
      loginMethod: 'cookie',
    },
  },
  {
    ...shared,
    name: 'token',
    title: 'Token Auth Studio',
    basePath: '/token',
    auth: {
      loginMethod: 'token',
    },
  },
])
