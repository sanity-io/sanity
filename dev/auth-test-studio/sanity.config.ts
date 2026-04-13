import {type Config, defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// ── Environment toggle ──────────────────────────────────────────────────────
// Set to true to use the staging API (api.sanity.work) instead of production.
const USE_STAGING = false

// ── Shared config ───────────────────────────────────────────────────────────
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

// ── Project configs per environment ─────────────────────────────────────────
const staging = {
  projectId: 'exx11uqh',
  dataset: 'playground',
  apiHost: 'https://api.sanity.work',
} as const

const production = {
  ppsg7ml5: {projectId: 'ppsg7ml5', dataset: 'test'},
  q5caobza: {projectId: 'q5caobza', dataset: 'production'},
} as const

const env = USE_STAGING ? staging : production.ppsg7ml5

// ── SSO provider example ────────────────────────────────────────────────────
// Replace with your own SSO provider URL to test custom/enterprise SSO login.
const ssoProvider = {
  name: 'saml',
  title: 'Company SSO',
  url: `https://api.sanity.io/v1/auth/login/saml?projectId=${env.projectId}`,
}

// ── Workspace definitions ───────────────────────────────────────────────────
// Base paths must match what e2e tests expect:
//   - /cookie  (cookieAuth.spec.ts)
//   - /token   (tokenAuth.spec.ts)

const workspaces = [
  // Default login methods
  {
    ...env,
    name: 'cookie',
    title: 'Cookie auth',
    basePath: '/cookie',
    auth: {loginMethod: 'cookie'},
  },
  {
    ...env,
    name: 'token',
    title: 'Token auth',
    basePath: '/token',
    auth: {loginMethod: 'token'},
  },
  {
    ...env,
    name: 'dual',
    title: 'Dual auth (default)',
    basePath: '/dual',
    auth: {loginMethod: 'dual'},
  },

  // redirectOnSingle — skips the provider chooser when only one provider is configured
  {
    ...env,
    name: 'cookie-redirect',
    title: 'Cookie + redirectOnSingle',
    basePath: '/cookie/redirect-on-single',
    auth: {
      loginMethod: 'cookie',
      redirectOnSingle: true,
      providers: [
        {name: 'github', title: 'GitHub', url: 'https://api.sanity.io/v1/auth/login/github'},
      ],
      mode: 'replace',
    },
  },
  {
    ...env,
    name: 'token-redirect',
    title: 'Token + redirectOnSingle',
    basePath: '/token/redirect-on-single',
    auth: {
      loginMethod: 'token',
      redirectOnSingle: true,
      providers: [
        {name: 'github', title: 'GitHub', url: 'https://api.sanity.io/v1/auth/login/github'},
      ],
      mode: 'replace',
    },
  },

  // SSO — replaces default providers with a single SSO provider
  {
    ...env,
    name: 'sso-cookie',
    title: 'SSO (cookie)',
    basePath: '/sso/cookie',
    auth: {
      loginMethod: 'cookie',
      providers: [ssoProvider],
      mode: 'replace',
    },
  },
  {
    ...env,
    name: 'sso-token',
    title: 'SSO (token)',
    basePath: '/sso/token',
    auth: {
      loginMethod: 'token',
      providers: [ssoProvider],
      mode: 'replace',
    },
  },
  {
    ...env,
    name: 'sso-redirect',
    title: 'SSO + redirectOnSingle',
    basePath: '/sso/redirect',
    auth: {
      loginMethod: 'dual',
      redirectOnSingle: true,
      providers: [ssoProvider],
      mode: 'replace',
    },
  },
] satisfies Config[]

export default defineConfig(workspaces.map((w) => ({...shared, ...w})))
