import {definedOperators} from './definedOperators'

const fieldPath = 'title'

describe('definedOperators', () => {
  it('should create a valid filter for defined', () => {
    const filter = definedOperators.defined.groqFilter({fieldPath})
    expect(filter).toEqual(`defined(${fieldPath})`)
  })

  it('should create a valid filter for notDefined', () => {
    const filter = definedOperators.notDefined.groqFilter({fieldPath})
    expect(filter).toEqual(`!defined(${fieldPath})`)
  })
})
