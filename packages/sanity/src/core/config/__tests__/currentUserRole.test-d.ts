import {type CurrentUser} from '@sanity/types'
import {assertType, expectTypeOf, test} from 'vitest'

import {type MockAuthStoreOptions} from '../../store/auth/mock/createMockAuthStore'
import {type CreateWorkspaceFromConfigOptions} from '../resolveConfig'
import {type ConfigContext} from '../types'

const currentUser = {
  id: 'schema-audit',
  name: 'Schema audit',
  email: 'schema-audit@example.com',
  roles: [{name: 'administrator', title: 'Administrator'}],
}

test('config context keeps role as an optional string', () => {
  expectTypeOf<NonNullable<ConfigContext['currentUser']>['role']>().toEqualTypeOf<
    string | undefined
  >()
})

test('createWorkspaceFromConfig accepts a current user without role', () => {
  assertType<CreateWorkspaceFromConfigOptions>({
    projectId: 'abc123',
    dataset: 'production',
    name: 'default',
    currentUser,
    getClient: () => {
      throw new Error('not called')
    },
  })
})

test('a user without role is still a CurrentUser', () => {
  expectTypeOf(currentUser).toExtend<CurrentUser>()
})

test('mock auth store accepts a current user without role', () => {
  assertType<MockAuthStoreOptions['currentUser']>(currentUser)
  assertType<MockAuthStoreOptions['currentUser']>(null)
})

test('a current user that still sets role is accepted', () => {
  const withRole: CurrentUser = {
    ...currentUser,
    // oxlint-disable-next-line no-deprecated -- existing callers may still pass the legacy field
    role: 'administrator',
  }

  assertType<NonNullable<ConfigContext['currentUser']>>(withRole)
  assertType<MockAuthStoreOptions['currentUser']>(withRole)
  assertType<CreateWorkspaceFromConfigOptions>({
    projectId: 'abc123',
    dataset: 'production',
    name: 'default',
    currentUser: withRole,
    getClient: () => {
      throw new Error('not called')
    },
  })
})
