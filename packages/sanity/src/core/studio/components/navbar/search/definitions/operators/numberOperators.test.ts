import type {OperatorNumberRangeValue} from './common'
import {numberOperators} from './numberOperators'

const fieldPath = 'title'
const value = 10

describe('numberOperators', () => {
  it('should create a valid filter for numberEqual', () => {
    const filter = numberOperators.numberEqual.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath} == ${value}`)
  })

  it('should create a valid filter for numberGt', () => {
    const filter = numberOperators.numberGt.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath} > ${value}`)
  })

  it('should create a valid filter for numberGte', () => {
    const filter = numberOperators.numberGte.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath} >= ${value}`)
  })

  it('should create a valid filter for numberLt', () => {
    const filter = numberOperators.numberLt.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath} < ${value}`)
  })

  it('should create a valid filter for numberLte', () => {
    const filter = numberOperators.numberLte.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath} <= ${value}`)
  })

  it('should create a valid filter for numberNotEqual', () => {
    const filter = numberOperators.numberNotEqual.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath} != ${value}`)
  })

  it('should create a valid filter for numberRange', () => {
    const valueRange: OperatorNumberRangeValue = {
      to: 10,
      from: 5,
    }
    const filter = numberOperators.numberRange.groqFilter({fieldPath, value: valueRange})
    expect(filter).toEqual(`${fieldPath} > ${valueRange.from} && ${fieldPath} < ${valueRange.to}`)
  })
})
