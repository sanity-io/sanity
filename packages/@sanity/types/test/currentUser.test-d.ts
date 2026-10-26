import {assertType, expectTypeOf, test} from 'vitest'

import {type CurrentUser} from '../src/user/types'

test('CurrentUser.role is optional and may be undefined', () => {
  expectTypeOf<CurrentUser['role']>().toEqualTypeOf<string | undefined>()
})

test('a current user can be built without the deprecated role', () => {
  assertType<CurrentUser>({
    id: 'schema-audit',
    name: 'Schema audit',
    email: 'schema-audit@example.com',
    roles: [{name: 'administrator', title: 'Administrator'}],
  })
})
