import {createAuthStore, defineConfig, type WorkspaceOptions} from 'sanity'
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

const envs = USE_STAGING ? [staging] : [production.ppsg7ml5, production.q5caobza]

// ── SSO provider ────────────────────────────────────────────────────────────
// Uses the Sanity.io SAML SSO endpoint. Replace the URL suffix with your own
// SSO configuration ID to test a different SSO provider.
const ssoProvider = {
  name: 'saml',
  title: 'saml',
  url: 'https://api.sanity.io/v2021-10-01/auth/saml/login/91cadf2a',
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

function createWorkspaces(env: {projectId: string; dataset: string; apiHost?: string}) {
  // When there are multiple envs (production), prefix names/paths with the project ID
  const prefix = envs.length > 1 ? `${env.projectId}-` : ''
  const pathPrefix = envs.length > 1 ? `/${env.projectId}` : ''
  const titleSuffix = envs.length > 1 ? ` (${env.projectId})` : ''

  return [
    // Default login methods
    {
      ...shared,
      ...env,
      name: `${prefix}cookie`,
      title: `Cookie auth${titleSuffix}`,
      basePath: `${pathPrefix}/cookie`,
      auth: {loginMethod: 'cookie'},
    },
    {
      ...shared,
      ...env,
      name: `${prefix}token`,
      title: `Token auth${titleSuffix}`,
      basePath: `${pathPrefix}/token`,
      auth: {loginMethod: 'token'},
    },
    {
      ...shared,
      ...env,
      name: `${prefix}dual`,
      title: `Dual auth (default)${titleSuffix}`,
      basePath: `${pathPrefix}/dual`,
      auth: {loginMethod: 'dual'},
    },

    // redirectOnSingle — skips the provider chooser when only one provider is configured
    {
      ...shared,
      ...env,
      name: `${prefix}cookie-redirectOnSingle`,
      title: `Cookie + redirectOnSingle${titleSuffix}`,
      basePath: `${pathPrefix}/cookie-redirectOnSingle`,
      auth: {loginMethod: 'cookie', redirectOnSingle: true, providers: [github], mode: 'replace'},
    },
    {
      ...shared,
      ...env,
      name: `${prefix}token-redirectOnSingle`,
      title: `Token + redirectOnSingle${titleSuffix}`,
      basePath: `${pathPrefix}/token-redirectOnSingle`,
      auth: {loginMethod: 'token', redirectOnSingle: true, providers: [github], mode: 'replace'},
    },
    {
      ...shared,
      ...env,
      name: `${prefix}dual-redirectOnSingle`,
      title: `Dual + redirectOnSingle${titleSuffix}`,
      basePath: `${pathPrefix}/dual-redirectOnSingle`,
      auth: {loginMethod: 'dual', redirectOnSingle: true, providers: [github], mode: 'replace'},
    },

    // SSO — uses createAuthStore with a single SAML provider replacing defaults
    {
      ...shared,
      ...env,
      name: `${prefix}sso-cookie`,
      title: `SSO (cookie)${titleSuffix}`,
      basePath: `${pathPrefix}/sso-cookie`,
      auth: createAuthStore({
        ...env,
        loginMethod: 'cookie',
        providers: [ssoProvider],
        mode: 'replace',
      }),
    },
    {
      ...shared,
      ...env,
      name: `${prefix}sso-token`,
      title: `SSO (token)${titleSuffix}`,
      basePath: `${pathPrefix}/sso-token`,
      auth: createAuthStore({
        ...env,
        loginMethod: 'token',
        providers: [ssoProvider],
        mode: 'replace',
      }),
    },
    {
      ...shared,
      ...env,
      name: `${prefix}sso-dual`,
      title: `SSO (dual)${titleSuffix}`,
      basePath: `${pathPrefix}/sso-dual`,
      auth: createAuthStore({
        ...env,
        loginMethod: 'dual',
        providers: [ssoProvider],
        mode: 'replace',
      }),
    },

    // SSO + redirectOnSingle — skips provider chooser, redirects straight to SSO
    {
      ...shared,
      ...env,
      name: `${prefix}sso-cookie-redirectOnSingle`,
      title: `SSO (cookie) + redirectOnSingle${titleSuffix}`,
      basePath: `${pathPrefix}/sso-cookie-redirectOnSingle`,
      auth: createAuthStore({
        ...env,
        loginMethod: 'cookie',
        redirectOnSingle: true,
        providers: [ssoProvider],
        mode: 'replace',
      }),
    },
    {
      ...shared,
      ...env,
      name: `${prefix}sso-token-redirectOnSingle`,
      title: `SSO (token) + redirectOnSingle${titleSuffix}`,
      basePath: `${pathPrefix}/sso-token-redirectOnSingle`,
      auth: createAuthStore({
        ...env,
        loginMethod: 'token',
        redirectOnSingle: true,
        providers: [ssoProvider],
        mode: 'replace',
      }),
    },
    {
      ...shared,
      ...env,
      name: `${prefix}sso-dual-redirectOnSingle`,
      title: `SSO (dual) + redirectOnSingle${titleSuffix}`,
      basePath: `${pathPrefix}/sso-dual-redirectOnSingle`,
      auth: createAuthStore({
        ...env,
        loginMethod: 'dual',
        redirectOnSingle: true,
        providers: [ssoProvider],
        mode: 'replace',
      }),
    },
  ] satisfies WorkspaceOptions[]
}

export default defineConfig(envs.flatMap(createWorkspaces))
