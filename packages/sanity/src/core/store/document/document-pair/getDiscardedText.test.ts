import {describe, expect, test} from 'vitest'

import {getDiscardedText} from './getDiscardedText'

const restored = {
  _id: 'drafts.a',
  _rev: 'r1',
  title: 'Hello',
  count: 1,
  body: [{_key: 'a', _type: 'block', children: [{_key: 'a1', _type: 'span', text: 'one'}]}],
}

describe('getDiscardedText', () => {
  test('returns each changed text value with its field', () => {
    expect(
      getDiscardedText({...restored, title: 'Hello world', subtitle: 'new'}, restored),
    ).toEqual([
      {field: 'title', text: 'Hello world'},
      {field: 'subtitle', text: 'new'},
    ])
  })

  test('returns a Portable Text block as one piece of text, with its spans joined', () => {
    const discarded = {
      ...restored,
      body: [
        {
          _key: 'a',
          _type: 'block',
          children: [
            {_key: 'a1', _type: 'span', text: 'one, '},
            {_key: 'a2', _type: 'span', text: 'bold', marks: ['strong']},
          ],
        },
      ],
    }
    expect(getDiscardedText(discarded, restored)).toEqual([{field: 'body', text: 'one, bold'}])
  })

  test('matches Portable Text blocks by key, so an inserted block does not mark the others as changed', () => {
    const discarded = {
      ...restored,
      body: [
        {_key: 'b', _type: 'block', children: [{_key: 'b1', _type: 'span', text: 'new block'}]},
        ...restored.body,
      ],
    }
    expect(getDiscardedText(discarded, restored)).toEqual([{field: 'body', text: 'new block'}])
  })

  test('ignores system fields, numbers and cleared text', () => {
    expect(getDiscardedText({...restored, _rev: 'r2', count: 2, title: ''}, restored)).toEqual([])
  })

  test('returns every text value when there is no confirmed copy', () => {
    expect(getDiscardedText({_id: 'drafts.a', title: 'Hello'}, null)).toEqual([
      {field: 'title', text: 'Hello'},
    ])
  })
})
