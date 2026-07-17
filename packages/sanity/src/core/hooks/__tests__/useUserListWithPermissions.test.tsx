import {type SanityClient} from '@sanity/client'
import {type User} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {of} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {grantsPermissionOn, useProjectStore, useUserStore} from '../../store'
import {type ProjectData, type ProjectStore} from '../../store/project'
import {type UserStore} from '../../store/user'
import {getSystemGroups$} from '../../util/getSystemGroups$'
import {useClient} from '../useClient'
import {useUserListWithPermissions} from '../useUserListWithPermissions'

vi.mock('../../store', () => {
  return {
    grantsPermissionOn: vi.fn(),
    useProjectStore: vi.fn(),
    useUserStore: vi.fn(),
  }
})
vi.mock('../../util/getSystemGroups$', () => ({getSystemGroups$: vi.fn()}))
vi.mock('../useClient', () => ({useClient: vi.fn()}))

const users: User[] = [
  {id: 'admin-user', displayName: 'Ada Admin'},
  {id: 'regional-user', displayName: 'Riley Regional'},
  {id: 'attribute-only-user', displayName: 'Uma Attribute Only'},
]
const documentValue = {_id: 'book-1', _type: 'b2bBook', language: 'en'}

function setup() {
  vi.mocked(useProjectStore).mockReturnValue({
    get: () =>
      of({
        members: users.map((user) => ({id: user.id, isRobot: false})),
      } as ProjectData),
  } as ProjectStore)
  vi.mocked(useUserStore).mockReturnValue({
    getUsers: vi.fn().mockResolvedValue(users),
  } as unknown as UserStore)
  vi.mocked(useClient).mockReturnValue({observable: {}} as SanityClient)
  vi.mocked(grantsPermissionOn).mockImplementation(async (_userId, grants) => {
    if (grants.some((grant) => grant.filter.includes('user::attributes()'))) {
      throw new Error('not implemented')
    }

    return {granted: true, reason: 'Matching grant'}
  })
  vi.mocked(getSystemGroups$).mockReturnValue(
    of([
      {
        members: ['admin-user', 'regional-user'],
        grants: [{filter: '_id in path("**")', permissions: ['read']}],
      },
      {
        members: ['regional-user', 'attribute-only-user'],
        grants: [
          {
            filter:
              '(_type match "b2b*") && defined(language) && language in user::attributes().locales',
            permissions: ['read'],
          },
        ],
      },
    ]),
  )

  return renderHook(() =>
    useUserListWithPermissions({
      documentValue,
      permission: 'read',
    }),
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useUserListWithPermissions', () => {
  it('keeps successful grant results when another grant cannot be evaluated', async () => {
    const {result} = setup()

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current).toEqual({
      data: [
        {id: 'admin-user', displayName: 'Ada Admin', granted: true},
        {id: 'regional-user', displayName: 'Riley Regional', granted: true},
        {id: 'attribute-only-user', displayName: 'Uma Attribute Only', granted: false},
      ],
      error: null,
      loading: false,
    })
  })
})
