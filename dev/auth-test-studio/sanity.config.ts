import {type Config, defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

const USE_STAGING = false

const STAGING1 = {
  name: 'token',
  projectId: 'exx11uqh',
  dataset: 'playground',
  basePath: '/token',
  apiHost: 'https://api.sanity.work',
  auth: {
    loginMethod: 'token',
  },
} satisfies Config

const STAGING2 = {
  name: 'cookie',
  projectId: 'exx11uqh',
  dataset: 'playground',
  basePath: '/cookie',
  apiHost: 'https://api.sanity.work',
  auth: {
    loginMethod: 'cookie',
  },
} satisfies Config

const PRODUCTION1 = {
  name: 'cookie',
  title: 'Cookie auth test',
  projectId: 'ppsg7ml5',
  dataset: 'test',
  basePath: '/cookie',
  auth: {
    loginMethod: 'cookie',
  },
} satisfies Config

const PRODUCTION2 = {
  name: 'token',
  title: 'Token auth test',
  projectId: 'q5caobza',
  dataset: 'production',
  basePath: '/token',
  auth: {
    loginMethod: 'token',
  },
} satisfies Config

const shared = {
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

export const PROJECTS = USE_STAGING ? [STAGING1, STAGING2] : [PRODUCTION1, PRODUCTION2]

export default defineConfig(PROJECTS.map((p) => ({...shared, ...p})))
