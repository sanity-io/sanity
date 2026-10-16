import {assertType, describe, expectTypeOf, test} from 'vitest'

import {type CurrentUser} from '../src/user/types'
import {type ValidationContext} from '../src/validation/types'

describe('ValidationContext', () => {
  test('exposes currentUser without the deprecated role field', () => {
    expectTypeOf<ValidationContext['currentUser']>().toEqualTypeOf<
      Omit<CurrentUser, 'role'> | null | undefined
    >()
  })

  test('currentUser is optional, so validation can run without a user', () => {
    assertType<ValidationContext>({
      getClient: () => {
        throw new Error('not called')
      },
      schema: {} as ValidationContext['schema'],
      environment: 'cli',
    })
  })

  test('currentUser accepts null', () => {
    assertType<ValidationContext>({
      getClient: () => {
        throw new Error('not called')
      },
      schema: {} as ValidationContext['schema'],
      environment: 'cli',
      currentUser: null,
    })
  })
})
