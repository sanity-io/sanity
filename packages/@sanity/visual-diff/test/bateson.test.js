import {isSameType} from '../src/differs/bateson'

describe('bateson tests', () => {
  test('isSameType returns true on both null objects', () => {
    const result = isSameType(null, null)
    expect(result).toBe(true)
  })
})
