import {type SanityClient} from '@sanity/client'
import {of, throwError} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getProjectGrants} from '../../../store/project/projectStore'
import {type ProjectGrants} from '../../../store/project/types'
import {fetchCanDeployStudio, hasDeployStudioGrant} from '../canDeployStudio'

vi.mock('../../../store/project/projectStore', () => ({
  getProjectGrants: vi.fn(),
}))

function grantsWith(grantNames: string[]): ProjectGrants {
  return {
    'sanity.project': [
      {
        id: 'role',
        name: 'role',
        title: 'Role',
        description: null,
        isCustom: false,
        config: {},
        grants: grantNames.map((name) => ({name, params: {}})),
      },
    ],
  }
}

describe('hasDeployStudioGrant', () => {
  it('returns true when the deployStudio grant is present', () => {
    expect(hasDeployStudioGrant(grantsWith(['deployStudio']))).toBe(true)
  })

  it('returns false when the deployStudio grant is absent', () => {
    expect(hasDeployStudioGrant(grantsWith(['read']))).toBe(false)
  })

  it('returns false when there are no sanity.project grants', () => {
    expect(hasDeployStudioGrant({})).toBe(false)
  })
})

function createMockClient(projectId: string | undefined) {
  return {
    config: () => ({projectId}),
  } as unknown as SanityClient
}

describe('fetchCanDeployStudio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves true when the user has the deployStudio grant', async () => {
    vi.mocked(getProjectGrants).mockReturnValue(of(grantsWith(['deployStudio'])))
    await expect(fetchCanDeployStudio(createMockClient('proj1'))).resolves.toBe(true)
  })

  it('resolves false when the user lacks the deployStudio grant', async () => {
    vi.mocked(getProjectGrants).mockReturnValue(of(grantsWith(['read'])))
    await expect(fetchCanDeployStudio(createMockClient('proj1'))).resolves.toBe(false)
  })

  it('resolves false (without fetching grants) when there is no projectId', async () => {
    await expect(fetchCanDeployStudio(createMockClient(undefined))).resolves.toBe(false)
    expect(getProjectGrants).not.toHaveBeenCalled()
  })

  it('resolves false when the grants observable errors', async () => {
    vi.mocked(getProjectGrants).mockReturnValue(throwError(() => new Error('403')))
    await expect(fetchCanDeployStudio(createMockClient('proj1'))).resolves.toBe(false)
  })
})
