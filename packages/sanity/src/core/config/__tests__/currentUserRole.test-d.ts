import {type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {describe, expectTypeOf, test} from 'vitest'

import {type MockAuthStoreOptions} from '../../store/auth/mock/createMockAuthStore'
import {createWorkspaceFromConfig, type CreateWorkspaceFromConfigOptions} from '../resolveConfig'
import {type ConfigContext} from '../types'

describe('currentUser without deprecated role', () => {
  test('CreateWorkspaceFromConfigOptions types currentUser without deprecated role', () => {
    expectTypeOf<
      Extract<CreateWorkspaceFromConfigOptions, {currentUser: unknown}>['currentUser']
    >().toEqualTypeOf<Omit<CurrentUser, 'role'>>()
  })

  test('createWorkspaceFromConfig accepts currentUser without role', () => {
    const currentUser: Omit<CurrentUser, 'role'> = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      roles: [{name: 'administrator', title: 'Administrator'}],
    }

    expectTypeOf(
      createWorkspaceFromConfig({
        projectId: 'project-id',
        dataset: 'production',
        currentUser,
        getClient: () => ({}) as SanityClient,
      }),
    ).toEqualTypeOf<ReturnType<typeof createWorkspaceFromConfig>>()
  })

  test('createWorkspaceFromConfig still accepts a full CurrentUser', () => {
    const currentUser = {} as CurrentUser

    expectTypeOf(
      createWorkspaceFromConfig({
        projectId: 'project-id',
        dataset: 'production',
        currentUser,
        getClient: () => ({}) as SanityClient,
      }),
    ).toEqualTypeOf<ReturnType<typeof createWorkspaceFromConfig>>()
  })

  test('ConfigContext exposes currentUser without deprecated role', () => {
    expectTypeOf<ConfigContext['currentUser']>().toEqualTypeOf<Omit<CurrentUser, 'role'> | null>()
  })

  test('MockAuthStoreOptions accepts currentUser without role', () => {
    expectTypeOf<MockAuthStoreOptions['currentUser']>().toEqualTypeOf<Omit<
      CurrentUser,
      'role'
    > | null>()
  })
})
