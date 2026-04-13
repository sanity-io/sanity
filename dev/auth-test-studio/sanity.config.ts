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

// ── SSO provider ────────────────────────────────────────────────────────────
// Uses the Sanity.io SAML SSO endpoint. Replace the URL suffix with your own
// SSO configuration ID to test a different SSO provider.
const ssoProvider = {
  name: 'saml',
  title: 'Sanity.io SSO',
  url: 'https://api.sanity.io/v2021-10-01/auth/saml/login/a9fd8216',
}

const github = {
  name: 'github',
  title: 'GitHub',
  url: 'https://api.sanity.io/v1/auth/login/github',
}

// ── Workspace definitions ───────────────────────────────────────────────────
// All basePaths must have the same number of segments (Sanity requirement).
// The e2e tests expect:
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
    name: 'cookie-redirectOnSingle',
    title: 'Cookie + redirectOnSingle',
    basePath: '/cookie-redirectOnSingle',
    auth: {loginMethod: 'cookie', redirectOnSingle: true, providers: [github], mode: 'replace'},
  },
  {
    ...env,
    name: 'token-redirectOnSingle',
    title: 'Token + redirectOnSingle',
    basePath: '/token-redirectOnSingle',
    auth: {loginMethod: 'token', redirectOnSingle: true, providers: [github], mode: 'replace'},
  },
  {
    ...env,
    name: 'dual-redirectOnSingle',
    title: 'Dual + redirectOnSingle',
    basePath: '/dual-redirectOnSingle',
    auth: {loginMethod: 'dual', redirectOnSingle: true, providers: [github], mode: 'replace'},
  },

  // SSO — replaces default providers with a single SSO provider
  {
    ...env,
    name: 'sso-cookie',
    title: 'SSO (cookie)',
    basePath: '/sso-cookie',
    auth: {loginMethod: 'cookie', providers: [ssoProvider], mode: 'replace'},
  },
  {
    ...env,
    name: 'sso-token',
    title: 'SSO (token)',
    basePath: '/sso-token',
    auth: {loginMethod: 'token', providers: [ssoProvider], mode: 'replace'},
  },

  // SSO + redirectOnSingle — skips provider chooser, redirects straight to SSO
  {
    ...env,
    name: 'sso-cookie-redirectOnSingle',
    title: 'SSO (cookie) + redirectOnSingle',
    basePath: '/sso-cookie-redirectOnSingle',
    auth: {
      loginMethod: 'cookie',
      redirectOnSingle: true,
      providers: [ssoProvider],
      mode: 'replace',
    },
  },
  {
    ...env,
    name: 'sso-token-redirectOnSingle',
    title: 'SSO (token) + redirectOnSingle',
    basePath: '/sso-token-redirectOnSingle',
    auth: {
      loginMethod: 'token',
      redirectOnSingle: true,
      providers: [ssoProvider],
      mode: 'replace',
    },
  },
  {
    ...env,
    name: 'sso-dual-redirectOnSingle',
    title: 'SSO (dual) + redirectOnSingle',
    basePath: '/sso-dual-redirectOnSingle',
    auth: {
      loginMethod: 'dual',
      redirectOnSingle: true,
      providers: [ssoProvider],
      mode: 'replace',
    },
  },
] satisfies Config[]

export default defineConfig(workspaces.map((workspace) => ({...shared, ...workspace})))
