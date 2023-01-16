import type {ReferenceValue} from '@sanity/types'
import {referenceOperators} from './referenceOperators'

const fieldPath = 'relatedArticle'
const valueDocument: ReferenceValue = {
  _ref: 'refArticle',
  _type: 'article',
}
const valueFile: ReferenceValue = {
  _ref: 'refFile',
  _type: 'sanity.fileAsset',
}
const valueImage: ReferenceValue = {
  _ref: 'refImage',
  _type: 'sanity.imageAsset',
}

describe('assetOperators', () => {
  it('should create a valid filter for referenceEqual', () => {
    const filter = referenceOperators.referenceEqual.groqFilter({fieldPath, value: valueDocument})
    expect(filter).toEqual(`${fieldPath}._ref == "${valueDocument._ref}"`)
  })
  it('should create a valid filter for referenceNotEqual', () => {
    const filter = referenceOperators.referenceNotEqual.groqFilter({
      fieldPath,
      value: valueDocument,
    })
    expect(filter).toEqual(`${fieldPath}._ref != "${valueDocument._ref}"`)
  })
  it('should create a valid filter for referencesAssetFile', () => {
    const filter = referenceOperators.referencesAssetFile.groqFilter({value: valueFile})
    expect(filter).toEqual(`references("${valueFile._ref}")`)
  })
  it('should create a valid filter for referencesAssetImage', () => {
    const filter = referenceOperators.referencesAssetImage.groqFilter({value: valueImage})
    expect(filter).toEqual(`references("${valueImage._ref}")`)
  })
  it('should create a valid filter for referencesDocument', () => {
    const filter = referenceOperators.referencesDocument.groqFilter({value: valueDocument})
    expect(filter).toEqual(`references("${valueDocument._ref}")`)
  })
})
