import type {ReferenceValue} from '@sanity/types'
import {arrayOperators} from './arrayOperators'
import {OperatorNumberRangeValue} from './common'

const fieldPath = 'items'
const valueCount = 10
const valueString = 'foo'
const valueReference: ReferenceValue = {
  _ref: 'ref',
  _type: 'article',
}

describe('arrayOperators', () => {
  it('should create a valid filter for arrayCountEqual', () => {
    const filter = arrayOperators.arrayCountEqual.groqFilter({fieldPath, value: valueCount})
    expect(filter).toEqual(`count(${fieldPath}) == ${valueCount}`)
  })

  it('should create a valid filter for arrayCountGt', () => {
    const filter = arrayOperators.arrayCountGt.groqFilter({fieldPath, value: valueCount})
    expect(filter).toEqual(`count(${fieldPath}) > ${valueCount}`)
  })

  it('should create a valid filter for arrayCountGte', () => {
    const filter = arrayOperators.arrayCountGte.groqFilter({fieldPath, value: valueCount})
    expect(filter).toEqual(`count(${fieldPath}) >= ${valueCount}`)
  })

  it('should create a valid filter for arrayCountLt', () => {
    const filter = arrayOperators.arrayCountLt.groqFilter({fieldPath, value: valueCount})
    expect(filter).toEqual(`count(${fieldPath}) < ${valueCount}`)
  })

  it('should create a valid filter for arrayCountLte', () => {
    const filter = arrayOperators.arrayCountLte.groqFilter({fieldPath, value: valueCount})
    expect(filter).toEqual(`count(${fieldPath}) <= ${valueCount}`)
  })

  it('should create a valid filter for arrayCountNotEqual', () => {
    const filter = arrayOperators.arrayCountNotEqual.groqFilter({fieldPath, value: valueCount})
    expect(filter).toEqual(`count(${fieldPath}) != ${valueCount}`)
  })

  it('should create a valid filter for arrayCountRange', () => {
    const value: OperatorNumberRangeValue = {
      max: 10,
      min: 5,
    }
    const filter = arrayOperators.arrayCountRange.groqFilter({fieldPath, value})
    expect(filter).toEqual(
      `count(${fieldPath}) > ${value.min} && count(${fieldPath}) < ${value.max}`
    )
  })

  it('should create a valid filter for arrayListIncludes', () => {
    const filter = arrayOperators.arrayListIncludes.groqFilter({fieldPath, value: valueString})
    expect(filter).toEqual(`"${valueString}" in ${fieldPath}`)
  })

  it('should create a valid filter for arrayListNotIncludes', () => {
    const filter = arrayOperators.arrayListNotIncludes.groqFilter({fieldPath, value: valueString})
    expect(filter).toEqual(`!("${valueString}" in ${fieldPath})`)
  })

  it('should create a valid filter for arrayReferenceIncludes', () => {
    const filter = arrayOperators.arrayReferenceIncludes.groqFilter({
      fieldPath,
      value: valueReference,
    })
    expect(filter).toEqual(`"${valueReference._ref}" in ${fieldPath}[]._ref`)
  })

  it('should create a valid filter for arrayReferenceNotIncludes', () => {
    const filter = arrayOperators.arrayReferenceNotIncludes.groqFilter({
      fieldPath,
      value: valueReference,
    })
    expect(filter).toEqual(`!("${valueReference._ref}" in ${fieldPath}[]._ref)`)
  })
})
