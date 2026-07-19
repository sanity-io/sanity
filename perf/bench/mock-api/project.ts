/**
 * Static project/auth fixtures. Shapes verified against their consumers:
 * - /users/me: createAuthStore.ts (must be 200 — a 401 loops; see
 *   e2e/tests/auth/helpers.ts for the precedent and rationale)
 * - /projects/<id>/datasets/<ds>/acl: grantsStore.ts evaluates each grant's
 *   `filter` with groq-js — the filter below matches every document, and the
 *   permissions include everything needed for an editable form
 * - /projects/<id>/grants: projectStore.ts ProjectGrants (an object)
 */

import {BENCH_USER, DATASET} from '../constants'

export const AUTH_PROBE = () => ({
  id: BENCH_USER.id,
  expiry: Math.floor(Date.now() / 1000) + 24 * 3600,
})

export const AUTH_PROVIDERS = {
  providers: [
    {name: 'google', title: 'Google', url: 'https://example.invalid/auth/login/google', logo: null},
  ],
  thirdPartyLogin: false,
}

export const DATASET_ACL = [
  {
    filter: '_id in path("**")',
    permissions: ['read', 'create', 'update', 'history', 'editHistory'],
  },
]

export function projectData(projectId: string): Record<string, unknown> {
  return {
    id: projectId,
    displayName: `Bench (${projectId})`,
    organizationId: 'bench-org',
    studioHost: null,
    metadata: {},
    isBlocked: false,
    isDisabled: false,
    isDisabledByUser: false,
    activityFeedEnabled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    members: [
      {
        id: BENCH_USER.id,
        role: 'administrator',
        isCurrentUser: true,
        isRobot: false,
      },
    ],
  }
}

// One dataset-agnostic store backs every dataset (incl. the comments addon
// dataset), so a single entry is enough here and for the /datasets handshake.
export const DATASETS = [{name: DATASET, aclMode: 'public'}]
