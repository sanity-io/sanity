import {describe, expect, it} from 'vitest'

import {resultSuffix} from '../casing'

describe('resultSuffix', () => {
  it('appends Result for camelCase', () => {
    expect(resultSuffix('userName')).toBe('userNameResult')
    expect(resultSuffix('value')).toBe('valueResult')
  })

  it('appends Result for PascalCase', () => {
    expect(resultSuffix('UserName')).toBe('UserNameResult')
    expect(resultSuffix('Value')).toBe('ValueResult')
  })

  it('appends _result for snake_case', () => {
    expect(resultSuffix('user_name')).toBe('user_name_result')
    expect(resultSuffix('value')).toBe('valueResult') // still valid camel case, covered above
  })

  it('appends _RESULT for UPPER_SNAKE', () => {
    expect(resultSuffix('USER_NAME')).toBe('USER_NAME_RESULT')
    expect(resultSuffix('VALUE')).toBe('VALUE_RESULT')
  })

  it("returns 'result' for empty string", () => {
    expect(resultSuffix('')).toBe('result')
  })

  it('falls back to camelCase style when casing is unknown', () => {
    expect(resultSuffix('user name')).toBe('usernameResult')
    expect(resultSuffix('weird$value!')).toBe('weirdvalueResult')
    expect(resultSuffix('123abc')).toBe('123abcResult')
  })
})
