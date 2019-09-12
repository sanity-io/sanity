import * as assert from 'assert'
import normalizeBlock from '../../../src/util/normalizeBlock'

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
    assert.deepEqual(normalizeBlock(block), {
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
    })
  })
})
