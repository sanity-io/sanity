import {type CurrentUser} from '@sanity/types'
import {assertType, expectTypeOf, test} from 'vitest'

import {type CreateWorkspaceFromConfigOptions} from '../resolveConfig'
import {type ConfigContext, type DocumentActionsContext} from '../types'

test('ConfigContext.currentUser omits the deprecated role', () => {
  expectTypeOf<ConfigContext['currentUser']>().toEqualTypeOf<Omit<CurrentUser, 'role'> | null>()
})

test('document action context inherits the current user without role', () => {
  expectTypeOf<DocumentActionsContext['currentUser']>().toEqualTypeOf<
    ConfigContext['currentUser']
  >()
})

test('createWorkspaceFromConfig accepts a current user without the deprecated role', () => {
  assertType<CreateWorkspaceFromConfigOptions>({
    projectId: 'abc123',
    dataset: 'production',
    name: 'default',
    currentUser: {
      id: 'schema-audit',
      name: 'Schema audit',
      email: 'schema-audit@example.com',
      roles: [{name: 'administrator', title: 'Administrator'}],
    },
    getClient: () => {
      throw new Error('not called')
    },
  })
})

test('a CurrentUser value can still be passed to createWorkspaceFromConfig', () => {
  expectTypeOf<CurrentUser>().toExtend<
    Extract<CreateWorkspaceFromConfigOptions, {currentUser: unknown}>['currentUser']
  >()
})
