import {describe, expect, it} from 'vitest'

import {regenerateKeys} from '../regenerateKeys'

const HEX_12 = /^[a-f0-9]{12}$/

describe('regenerateKeys', () => {
  it('regenerates the top-level _key and preserves all other fields', () => {
    const item = {_key: 'original', _type: 'block', title: 'Hello', count: 42, active: true}
    const result = regenerateKeys(item)

    expect(result._key).not.toBe('original')
    expect(result._key).toMatch(HEX_12)
    expect(result._type).toBe('block')
    expect(result.title).toBe('Hello')
    expect(result.count).toBe(42)
    expect(result.active).toBe(true)
  })

  it('regenerates keys in nested arrays', () => {
    const item = {
      _key: 'parent',
      items: [
        {_key: 'child1', value: 'a'},
        {_key: 'child2', value: 'b'},
      ],
    }
    const result = regenerateKeys(item)

    expect(result.items[0]._key).not.toBe('child1')
    expect(result.items[1]._key).not.toBe('child2')
    expect(result.items[0]._key).not.toBe(result.items[1]._key)
    expect(result.items[0].value).toBe('a')
  })

  it('regenerates keys at every depth, including through plain nested objects', () => {
    const item = {
      _key: 'root',
      rows: [{_key: 'row', cells: [{_key: 'cell', blocks: [{_key: 'block', text: 'deep'}]}]}],
      metadata: {section: {items: [{_key: 'deep', label: 'x'}]}},
    }
    const result = regenerateKeys(item)

    expect(result.rows[0]._key).not.toBe('row')
    expect(result.rows[0].cells[0]._key).not.toBe('cell')
    expect(result.rows[0].cells[0].blocks[0]._key).not.toBe('block')
    expect(result.metadata.section.items[0]._key).not.toBe('deep')
    expect(result.rows[0].cells[0].blocks[0].text).toBe('deep')
  })

  it('leaves primitive arrays untouched; regenerates keys in mixed arrays', () => {
    const item = {
      _key: 'aaa',
      tags: ['foo', 'bar'],
      scores: [1, 2, 3],
      mixed: ['hello', {_key: 'obj', value: 1}, 42],
    }
    const result = regenerateKeys(item)

    expect(result.tags).toEqual(['foo', 'bar'])
    expect(result.scores).toEqual([1, 2, 3])
    expect(result.mixed[0]).toBe('hello')
    expect(result.mixed[2]).toBe(42)
    expect(result.mixed[1]).toMatchObject({_key: expect.stringMatching(HEX_12), value: 1})
  })

  it('regenerates markDefs keys and remaps children marks to match', () => {
    const item = {
      _key: 'block',
      _type: 'block',
      markDefs: [
        {_key: 'link1', _type: 'link', href: 'https://example.com'},
        {_key: 'annot', _type: 'note', content: [{_key: 'inner', text: 'note'}]},
      ],
      children: [
        {_key: 'span1', _type: 'span', text: 'click', marks: ['link1']},
        {_key: 'span2', _type: 'span', text: 'bold', marks: ['annot', 'strong']},
        {_key: 'span3', _type: 'span', text: 'plain', marks: []},
      ],
    }
    const result = regenerateKeys(item)
    const [newLink, newAnnot] = result.markDefs.map((d) => d._key)

    expect(newLink).not.toBe('link1')
    expect(newAnnot).not.toBe('annot')
    // Children marks are remapped to the new markDef keys
    expect(result.children[0].marks).toEqual([newLink])
    expect(result.children[1].marks).toContain(newAnnot)
    expect(result.children[1].marks).toContain('strong')
    expect(result.children[0]._key).not.toBe('span1')
    expect(result.markDefs[0].href).toBe('https://example.com')
    // Nested content inside markDefs also gets new keys
    expect(result.markDefs[1]).toMatchObject({content: [{_key: expect.stringMatching(HEX_12)}]})
  })

  it('regenerates children keys and leaves marks untouched when no markDefs exist', () => {
    const item = {
      _key: 'block',
      _type: 'block',
      children: [{_key: 'span', _type: 'span', text: 'bold', marks: ['strong']}],
    }
    const result = regenerateKeys(item)

    expect(result.children[0]._key).not.toBe('span')
    expect(result.children[0].marks).toEqual(['strong'])
  })

  it('handles null, undefined, and empty array values without throwing', () => {
    const item = {_key: 'aaa', a: null, b: undefined, c: []}
    const result = regenerateKeys(item)

    expect(result.a).toBeNull()
    expect(result.b).toBeUndefined()
    expect(result.c).toEqual([])
    expect(result._key).toMatch(HEX_12)
  })

  it('leaves array items without _key untouched', () => {
    const noKey = {title: 'no key'}
    const item = {_key: 'aaa', items: [noKey, {_key: 'keyed', value: 1}]}
    const result = regenerateKeys(item)

    expect(result.items[0]).toEqual({title: 'no key'})
    expect(result.items[1]).toMatchObject({_key: expect.stringMatching(HEX_12)})
  })

  it('does not remap marks when children are not records', () => {
    const item = {
      _key: 'root',
      _type: 'myCustomType',
      markDefs: [{_key: 'x123', label: 'Definition'}],
      children: ['x123', 'bold'],
    }
    const result = regenerateKeys(item)

    expect(result.children).toEqual(['x123', 'bold'])
  })

  it('remaps marks for named PT block types', () => {
    const item = {
      _key: 'block',
      _type: 'customHoistedBlock',
      markDefs: [{_key: 'link1', _type: 'link', href: 'https://example.com'}],
      children: [{_key: 'span1', _type: 'span', text: 'click', marks: ['link1']}],
    }
    const result = regenerateKeys(item)
    const [newLinkKey] = result.markDefs.map((def) => def._key)

    expect(result.children[0].marks).toEqual([newLinkKey])
  })

  it('does not mutate the input', () => {
    const item = {
      _key: 'root',
      items: [{_key: 'child', value: 'a'}],
      markDefs: [{_key: 'link', _type: 'link', href: 'https://example.com'}],
      children: [{_key: 'span', _type: 'span', text: 'text', marks: ['link']}],
    }
    const snapshot = JSON.stringify(item)
    regenerateKeys(item)

    expect(JSON.stringify(item)).toBe(snapshot)
  })
})
