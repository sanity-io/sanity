import {type Config, defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

const USE_STAGING = false

const STAGING_WITH_COOKIE_AUTH = {
  name: 'cookie',
  title: '[staging] Cookie',
  projectId: 'exx11uqh',
  dataset: 'playground',
  basePath: '/cookie',
  apiHost: 'https://api.sanity.work',
  auth: {
    loginMethod: 'cookie',
  },
} satisfies Config

const STAGING_WITH_TOKEN_AUTH = {
  name: 'token',
  title: '[staging] Token',
  projectId: 'exx11uqh',
  dataset: 'playground',
  basePath: '/token',
  apiHost: 'https://api.sanity.work',
  auth: {
    loginMethod: 'token',
  },
} satisfies Config

const PRODUCTION_WITH_COOKIE_AUTH = {
  name: 'cookie',
  title: 'Cookie',
  projectId: 'ppsg7ml5',
  dataset: 'test',
  basePath: '/cookie/default',
  auth: {
    loginMethod: 'cookie',
  },
} satisfies Config

const PRODUCTION_WITH_TOKEN_AUTH = {
  name: 'token',
  title: 'Token',
  projectId: 'q5caobza',
  dataset: 'production',
  basePath: '/token/default',
  auth: {
    loginMethod: 'token',
  },
} satisfies Config

const PRODUCTION_WITH_DUAL_AUTH = {
  name: 'dual',
  title: 'Dual',
  projectId: 'q5caobza',
  dataset: 'production',
  basePath: '/token/dual',
  auth: {
    loginMethod: 'dual',
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

export const PROJECTS = USE_STAGING
  ? ([
      STAGING_WITH_TOKEN_AUTH,
      STAGING_WITH_COOKIE_AUTH,
      {
        ...STAGING_WITH_TOKEN_AUTH,
        title: `${STAGING_WITH_TOKEN_AUTH.title} – redirectOnSingle`,
        basePath: '/token/redirect-on-single',
        name: `${STAGING_WITH_TOKEN_AUTH.name}_redirectOnSingle`,
        auth: {...STAGING_WITH_TOKEN_AUTH.auth, redirectOnSingle: true},
      },
      {
        ...STAGING_WITH_COOKIE_AUTH,
        title: `${STAGING_WITH_COOKIE_AUTH.title} – redirectOnSingle`,
        basePath: '/cookie/redirect-on-single',
        name: `${STAGING_WITH_COOKIE_AUTH.name}_redirectOnSingle`,

        auth: {...STAGING_WITH_COOKIE_AUTH.auth, redirectOnSingle: true},
      },
    ] satisfies Config)
  : ([
      PRODUCTION_WITH_COOKIE_AUTH,
      PRODUCTION_WITH_TOKEN_AUTH,
      PRODUCTION_WITH_DUAL_AUTH,
      {
        ...PRODUCTION_WITH_COOKIE_AUTH,
        title: `${PRODUCTION_WITH_COOKIE_AUTH.title} – redirectOnSingle`,
        name: `${PRODUCTION_WITH_COOKIE_AUTH.name}-redirect-on-single`,
        basePath: '/cookie/redirect-on-single',
        auth: {
          ...PRODUCTION_WITH_COOKIE_AUTH.auth,
          redirectOnSingle: true,
          providers: [
            {name: 'github', title: 'GitHub', url: 'https://api.sanity.io/v1/auth/login/github'},
          ],
          mode: 'replace',
        },
      },
      {
        ...PRODUCTION_WITH_TOKEN_AUTH,
        title: `${PRODUCTION_WITH_TOKEN_AUTH.title} – redirectOnSingle`,
        name: `${PRODUCTION_WITH_TOKEN_AUTH.name}-redirect-on-single`,
        basePath: '/token/redirect-on-single',
        auth: {
          ...PRODUCTION_WITH_TOKEN_AUTH.auth,
          redirectOnSingle: true,
          providers: [
            {name: 'github', title: 'GitHub', url: 'https://api.sanity.io/v1/auth/login/github'},
          ],
          mode: 'replace',
        },
      },
      {
        ...PRODUCTION_WITH_DUAL_AUTH,
        title: `${PRODUCTION_WITH_DUAL_AUTH.title} – redirectOnSingle`,
        name: `${PRODUCTION_WITH_DUAL_AUTH.name}-redirect-on-single`,
        basePath: '/dual/redirect-on-single',
        auth: {
          ...PRODUCTION_WITH_DUAL_AUTH.auth,
          redirectOnSingle: true,
          providers: [
            {name: 'github', title: 'GitHub', url: 'https://api.sanity.io/v1/auth/login/sanity'},
          ],
          mode: 'replace',
        },
      },
    ] satisfies Config[])

export default defineConfig(PROJECTS.map((p) => ({...shared, ...p})))
