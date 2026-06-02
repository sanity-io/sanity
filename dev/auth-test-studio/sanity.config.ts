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

const envs = USE_STAGING ? [staging] : [production.ppsg7ml5]

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
