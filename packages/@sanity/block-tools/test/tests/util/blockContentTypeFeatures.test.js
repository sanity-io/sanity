import assert from 'assert'
import blockContentTypeFeatures from '../../../src/util/blockContentTypeFeatures'
import customSchema from '../../fixtures/customSchema'
import defaultSchema from '../../fixtures/defaultSchema'

describe('blockContentTypeFeatures', () => {
  it('will give a sane feature set for the default schema', () => {
    const blockContentType = defaultSchema
      .get('blogPost')
      .fields.find(field => field.name === 'body').type
    const expected = require('../../fixtures/defaultFeatures.json')
    assert.deepEqual(
      JSON.parse(JSON.stringify(blockContentTypeFeatures(blockContentType))),
      expected
    )
  })

  it('will give spesific features for a custom schema', () => {
    const blockContentType = customSchema
      .get('blogPost')
      .fields.find(field => field.name === 'body').type
    const expected = require('../../fixtures/customFeatures.json')
    assert.deepEqual(
      JSON.parse(JSON.stringify(blockContentTypeFeatures(blockContentType))),
      expected
    )
  })
})
