import {describe, expectTypeOf, test} from 'vitest'

import {type AuthConfig} from '../types'

describe('AuthConfig', () => {
  test('accepts login provider options or OAuth, not both', () => {
    expectTypeOf({loginMethod: 'token' as const, redirectOnSingle: true}).toExtend<AuthConfig>()
    expectTypeOf({experimental_oauth: {clientId: 'oc-1'}, apiHost: 'x'}).toExtend<AuthConfig>()

    expectTypeOf({
      experimental_oauth: {clientId: 'oc-1'},
      loginMethod: 'token' as const,
    }).not.toExtend<AuthConfig>()
    expectTypeOf({
      experimental_oauth: {clientId: 'oc-1'},
      providers: [],
    }).not.toExtend<AuthConfig>()
  })
})
