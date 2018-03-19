import assert from 'assert'
import blockContentTypeToOptions from '../../../src/util/blockContentTypeToOptions'
import customSchema from '../../fixtures/customSchema'
import defaultSchema from '../../fixtures/defaultSchema'

describe('blockContentTypeToOptions', () => {
  it('will give sane default options for default schema', () => {
    const blockContentType = defaultSchema
      .get('blogPost')
      .fields.find(field => field.name === 'body').type
    const expected = {
      annotations: [{title: 'Link', value: 'link'}],
      decorators: [
        {title: 'Strong', value: 'strong'},
        {title: 'Emphasis', value: 'em'},
        {title: 'Code', value: 'code'},
        {title: 'Underline', value: 'underline'},
        {title: 'Strike', value: 'strike-through'}
      ],
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading 1', value: 'h1'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'H4', value: 'h4'},
        {title: 'H5', value: 'h5'},
        {title: 'H6', value: 'h6'},
        {title: 'Quote', value: 'blockquote'}
      ]
    }
    assert.deepEqual(blockContentTypeToOptions(blockContentType), expected)
  })

  xit('will give spesific options for custom schema', () => {
    const blockContentType = customSchema
      .get('blogPost')
      .fields.find(field => field.name === 'body').type

    const expected = {
      annotations: [{title: 'Author', value: 'author'}],
      decorators: [{title: 'Strong', value: 'strong'}, {title: 'Emphasis', value: 'em'}],
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading 1', value: 'h1'},
        {title: 'H2', value: 'h2'}
      ]
    }
    assert.deepEqual(blockContentTypeToOptions(blockContentType), expected)
  })
})
