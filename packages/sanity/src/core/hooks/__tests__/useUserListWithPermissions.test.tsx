import {type SanityClient} from '@sanity/client'
import {type User} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {of} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {useProjectStore, useUserStore} from '../../store'
import {type ProjectData, type ProjectStore} from '../../store/project'
import {type UserStore} from '../../store/user'
import {getSystemGroups$} from '../../util/getSystemGroups$'
import {useClient} from '../useClient'
import {useUserListWithPermissions} from '../useUserListWithPermissions'

vi.mock('../../store', async () => {
  const {grantsPermissionOn} = await import('../../store/grants/grantsStore')

  return {
    grantsPermissionOn,
    useProjectStore: vi.fn(),
    useUserStore: vi.fn(),
  }
})
vi.mock('../../util/getSystemGroups$', () => ({getSystemGroups$: vi.fn()}))
vi.mock('../useClient', () => ({useClient: vi.fn()}))

const users: User[] = [
  {id: 'admin-user', displayName: 'Ada Admin'},
  {id: 'regional-user', displayName: 'Riley Regional'},
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
  vi.mocked(getSystemGroups$).mockReturnValue(
    of([
      {
        members: ['admin-user'],
        grants: [{filter: '_id in path("**")', permissions: ['read']}],
      },
      {
        members: ['regional-user'],
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
  it('keeps evaluable users when another user has an unevaluable grant filter', async () => {
    const {result} = setup()

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current).toEqual({
      data: [
        {id: 'admin-user', displayName: 'Ada Admin', granted: true},
        {id: 'regional-user', displayName: 'Riley Regional', granted: false},
      ],
      error: null,
      loading: false,
    })
  })
})
