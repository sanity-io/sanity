import type {ObjectSchemaType} from '@sanity/types'
import blockContentTypeFeatures from '../../../src/util/blockContentTypeFeatures'
import customSchema from '../../fixtures/customSchema'
import defaultSchema from '../../fixtures/defaultSchema'

describe('blockContentTypeFeatures', () => {
  it('will give a sane feature set for the default schema', () => {
    const blockContentType = (defaultSchema.get('blogPost') as ObjectSchemaType).fields.find(
      (field) => field.name === 'body',
    )?.type

    if (!blockContentType || blockContentType.jsonType !== 'array') {
      throw new Error('Failed to find type')
    }

    expect(blockContentTypeFeatures(blockContentType)).toMatchSnapshot()
  })

  it('will give spesific features for a custom schema', () => {
    const blockContentType = (customSchema.get('blogPost') as ObjectSchemaType).fields.find(
      (field) => field.name === 'body',
    )?.type

    if (!blockContentType || blockContentType.jsonType !== 'array') {
      throw new Error('Failed to find type')
    }
    expect(blockContentTypeFeatures(blockContentType)).toMatchSnapshot()
  })
})
