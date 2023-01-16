import {stringOperators} from './stringOperators'

const fieldPath = 'title'
const value = 'foo'

describe('stringOperators', () => {
  it('should create a valid filter for stringEqual', () => {
    const filter = stringOperators.stringEqual.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath} == "${value}"`)
  })

  it('should create a valid filter for stringListEqual', () => {
    const filter = stringOperators.stringListEqual.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath} == "${value}"`)
  })

  it('should create a valid filter for stringListNotEqual', () => {
    const filter = stringOperators.stringListNotEqual.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath} != "${value}"`)
  })

  it('should create a valid filter for stringMatches', () => {
    const filter = stringOperators.stringMatches.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath} match "${value}"`)
  })

  it('should create a valid filter for stringNotEqual', () => {
    const filter = stringOperators.stringNotEqual.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath} != "${value}"`)
  })
})
