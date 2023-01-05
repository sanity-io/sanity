import type {ReferenceValue} from '@sanity/types'
import {assetOperators} from './assetOperators'

const fieldPath = 'asset'
const valueFile: ReferenceValue = {
  _ref: 'refFile',
  _type: 'sanity.fileAsset',
}
const valueImage: ReferenceValue = {
  _ref: 'refImage',
  _type: 'sanity.imageAsset',
}

describe('assetOperators', () => {
  it('should create a valid filter for assetFileEqual', () => {
    const filter = assetOperators.assetFileEqual.groqFilter({fieldPath, value: valueFile})
    expect(filter).toEqual(`${fieldPath}.asset._ref == "${valueFile._ref}"`)
  })
  it('should create a valid filter for assetFileNotEqual', () => {
    const filter = assetOperators.assetFileNotEqual.groqFilter({fieldPath, value: valueFile})
    expect(filter).toEqual(`${fieldPath}.asset._ref != "${valueFile._ref}"`)
  })
  it('should create a valid filter for assetImageEqual', () => {
    const filter = assetOperators.assetImageEqual.groqFilter({fieldPath, value: valueImage})
    expect(filter).toEqual(`${fieldPath}.asset._ref == "${valueImage._ref}"`)
  })
  it('should create a valid filter for assetImageNotEqual', () => {
    const filter = assetOperators.assetImageNotEqual.groqFilter({fieldPath, value: valueImage})
    expect(filter).toEqual(`${fieldPath}.asset._ref != "${valueImage._ref}"`)
  })
})
