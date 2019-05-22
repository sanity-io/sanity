import assert from 'assert'
import blockContentTypeToOptions from '../../../src/util/blockContentTypeToOptions'
import defaultSchema from '../../fixtures/defaultSchema'
import normalizeBlock from '../../../src/util/normalizeBlock'

const blockContentType = defaultSchema.get('blogPost').fields.find(field => field.name === 'body')
  .type

const blockType = blockContentTypeToOptions(blockContentType).types.block

describe('normalizeBlock', () => {
  it('will normalize a block', () => {
    const block = {
      _type: 'block',
      children: [
        {
          _type: 'span',
          text: 'Foobar'
        }
      ]
    }
    assert.deepEqual(
      normalizeBlock(block, blockType),

      {
        _key: 'randomKey0',
        _type: 'block',
        children: [
          {
            _key: 'randomKey00',
            _type: 'span',
            marks: [],
            text: 'Foobar'
          }
        ],
        markDefs: []
      }
    )
  })
})
