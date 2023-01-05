import {booleanOperators} from './booleanOperators'

const fieldPath = 'selected'
const value = true

describe('booleanOperators', () => {
  it('should create a valid filter for booleanQual', () => {
    const filter = booleanOperators.booleanEqual.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath} == ${value}`)
  })
})
