import {portableTextOperators} from './portableTextOperators'

const fieldPath = 'body'
const value = 'foo'

describe('stringOperators', () => {
  it('should create a valid filter for portableTextEqual', () => {
    const filter = portableTextOperators.portableTextEqual.groqFilter({fieldPath, value})
    expect(filter).toEqual(`pt::text(${fieldPath}) == "${value}"`)
  })

  it('should create a valid filter for portableTextMatches', () => {
    const filter = portableTextOperators.portableTextMatches.groqFilter({fieldPath, value})
    expect(filter).toEqual(`pt::text(${fieldPath}) match "${value}"`)
  })

  it('should create a valid filter for portableTextNotEqual', () => {
    const filter = portableTextOperators.portableTextNotEqual.groqFilter({fieldPath, value})
    expect(filter).toEqual(`pt::text(${fieldPath}) != "${value}"`)
  })

  it('should create a valid filter for portableTextNotMatches', () => {
    const filter = portableTextOperators.portableTextNotMatches.groqFilter({fieldPath, value})
    expect(filter).toEqual(`!(pt::text(${fieldPath}) match "${value}")`)
  })
})
