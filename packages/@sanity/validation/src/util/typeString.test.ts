import typeString from './typeString'

describe('typeString', () => {
  it('returns the a type string of built in types', () => {
    expect(typeString({})).toBe('Object')
    expect(
      typeString(function () {
        // intentionally blank
      })
    ).toBe('Function')
    expect(typeString(['hey'])).toBe('Array')
    expect(typeString('some string')).toBe('String')
    expect(typeString(false)).toBe('Boolean')
    expect(typeString(5)).toBe('Number')
    expect(typeString(new Date())).toBe('Date')
  })

  it('returns a type string string using the constructor', () => {
    class ExampleClass {}
    expect(typeString(new ExampleClass())).toBe('ExampleClass')
  })

  it('returns a type string for null or undefined', () => {
    expect(typeString(null)).toBe('null')
    expect(typeString(undefined)).toBe('undefined')
  })
})
