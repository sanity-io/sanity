import {type CurrentUser} from '@sanity/types'
import {assertType, expectTypeOf, test} from 'vitest'

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
