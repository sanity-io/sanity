import assert from 'assert'
import blockContentTypeToOptions from '../../../src/util/blockContentTypeToOptions'
import customSchema from '../../fixtures/customSchema'
import defaultSchema from '../../fixtures/defaultSchema'

describe('blockContentTypeToOptions', () => {

  it('will give sane default options for default schema', () => {
    const blockContentType = defaultSchema.get('blogPost')
      .fields.find(field => field.name === 'body').type

    const expected = {
      enabledBlockAnnotations: ['link'],
      enabledSpanDecorators: [
        'strong',
        'em',
        'code',
        'underline',
        'strike-through'
      ],
      enabledBlockStyles: [
        'normal',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote'
      ]
    }
    assert.deepEqual(blockContentTypeToOptions(blockContentType), expected)
  })

  it('will give spesific options for custom schema', () => {
    const blockContentType = customSchema.get('blogPost')
      .fields.find(field => field.name === 'body').type

    const expected = {
      enabledBlockAnnotations: ['author'],
      enabledSpanDecorators: [
        'strong',
        'em'
      ],
      enabledBlockStyles: [
        'normal',
        'h1',
        'h2'
      ]
    }
    assert.deepEqual(blockContentTypeToOptions(blockContentType), expected)
  })

})
