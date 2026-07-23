import {type Path} from '@sanity/types'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  isRootedPath,
  packageTableValue,
  rerootPatch,
  rerootPatches,
  rerootPath,
  ROOT_KEY,
  type TableCell,
  type StandaloneTableValue,
  TABLE_TYPE,
  unpackageTableValue,
} from './helpers'

function cell(key: string, text = ''): TableCell {
  return {
    _key: key,
    _type: 'cell',
    value: [
      {
        _key: `${key}-b`,
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_key: `${key}-s`, _type: 'span', text, marks: []}],
      },
    ],
  }
}

function sampleValue(): StandaloneTableValue {
  return {
    _type: TABLE_TYPE,
    rows: [
      {_key: 'r1', _type: 'row', cells: [cell('c1', 'a'), cell('c2', 'b')]},
      {_key: 'r2', _type: 'row', cells: [cell('c3', 'c'), cell('c4', 'd')]},
    ],
  }
}

describe('packageTableValue / unpackageTableValue', () => {
  it('packages a value as exactly one block keyed ROOT_KEY', () => {
    const packaged = packageTableValue(sampleValue())
    expect(packaged).toHaveLength(1)
    expect(packaged[0]._key).toBe(ROOT_KEY)
    expect(packaged[0]._type).toBe(TABLE_TYPE)
    expect(packaged[0].rows).toHaveLength(2)
  })

  it('round-trips a populated value (unpackage ∘ package === identity)', () => {
    const value = sampleValue()
    expect(unpackageTableValue(packageTableValue(value))).toEqual(value)
  })

  it('packages undefined as a single empty root block', () => {
    const packaged = packageTableValue(undefined)
    expect(packaged).toHaveLength(1)
    expect(packaged[0]).toMatchObject({_key: ROOT_KEY, _type: TABLE_TYPE, rows: []})
  })

  it('round-trips an empty document to an empty-rows value', () => {
    expect(unpackageTableValue(packageTableValue(undefined))).toEqual({_type: TABLE_TYPE, rows: []})
  })

  it('overwrites any incoming _key/_type so the synthetic block is well-formed', () => {
    const packaged = packageTableValue({
      _type: 'somethingElse' as never,
      _key: 'stale' as never,
      rows: [],
    } as StandaloneTableValue)
    expect(packaged[0]._key).toBe(ROOT_KEY)
    expect(packaged[0]._type).toBe(TABLE_TYPE)
  })

  it('preserves sibling fields on the object through a round-trip', () => {
    const value = {_type: TABLE_TYPE, headerRows: 1, rows: []} as unknown as StandaloneTableValue
    const back = unpackageTableValue(packageTableValue(value))
    expect(back).toMatchObject({headerRows: 1})
  })

  it('unpackages undefined/empty editor value to undefined', () => {
    expect(unpackageTableValue(undefined)).toBeUndefined()
    expect(unpackageTableValue([])).toBeUndefined()
  })

  it('unpackages a single empty block (no rows) to empty-rows value', () => {
    expect(unpackageTableValue([{_key: ROOT_KEY, _type: TABLE_TYPE}])).toEqual({
      _type: TABLE_TYPE,
      rows: [],
    })
  })

  it('falls back to the first block when the root key is missing', () => {
    const back = unpackageTableValue([
      {_key: 'lostkey', _type: TABLE_TYPE, rows: [{_key: 'r', _type: 'row'}]},
    ])
    expect(back?.rows).toHaveLength(1)
  })
})

describe('isRootedPath / rerootPath', () => {
  it('recognizes a path rooted at the synthetic block', () => {
    expect(isRootedPath([{_key: ROOT_KEY}, 'rows'])).toBe(true)
  })

  it('rejects a path rooted at a different key', () => {
    expect(isRootedPath([{_key: 'other'}, 'rows'])).toBe(false)
  })

  it('rejects an empty path (whole-value patch)', () => {
    expect(isRootedPath([])).toBe(false)
  })

  it('rejects a path starting with a field name rather than a key', () => {
    expect(isRootedPath(['rows', {_key: 'r1'}])).toBe(false)
  })

  it('strips the leading root segment, keeping the remainder', () => {
    const path: Path = [{_key: ROOT_KEY}, 'rows', {_key: 'r1'}, 'cells', {_key: 'c1'}, 'value']
    expect(rerootPath(path)).toEqual(['rows', {_key: 'r1'}, 'cells', {_key: 'c1'}, 'value'])
  })

  it('reroots a path targeting the root block itself to an empty path', () => {
    expect(rerootPath([{_key: ROOT_KEY}])).toEqual([])
  })

  it('returns null for a non-rooted path', () => {
    expect(rerootPath([{_key: 'other'}, 'rows'])).toBeNull()
  })
})

describe('rerootPatch / rerootPatches', () => {
  it('reroots a granular set patch, preserving its value', () => {
    const patch = {
      type: 'set',
      path: [{_key: ROOT_KEY}, 'rows', {_key: 'r1'}, 'cells', {_key: 'c1'}, 'value', {_key: 'b1'}],
      value: {_type: 'block', children: []},
    }
    expect(rerootPatch(patch)).toEqual({
      type: 'set',
      path: ['rows', {_key: 'r1'}, 'cells', {_key: 'c1'}, 'value', {_key: 'b1'}],
      value: {_type: 'block', children: []},
    })
  })

  it('preserves diffMatchPatch/insert extras when re-rooting', () => {
    const insert = {
      type: 'insert',
      position: 'after',
      items: [{_key: 'x', _type: 'row'}],
      path: [{_key: ROOT_KEY}, 'rows', {_key: 'r1'}],
    }
    expect(rerootPatch(insert)).toEqual({
      type: 'insert',
      position: 'after',
      items: [{_key: 'x', _type: 'row'}],
      path: ['rows', {_key: 'r1'}],
    })
  })

  it('returns null for a patch not rooted at ROOT_KEY', () => {
    expect(rerootPatch({type: 'set', path: [], value: 'whole'})).toBeNull()
  })

  describe('rerootPatches', () => {
    afterEach(() => vi.restoreAllMocks())

    it('keeps rooted patches and drops non-rooted ones with a warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const patches = [
        {type: 'set', path: [{_key: ROOT_KEY}, 'rows', {_key: 'r1'}], value: 1},
        {type: 'set', path: [] as Path, value: 'whole-value-set'}, // dropped
        {type: 'unset', path: [{_key: 'stray'}, 'rows']}, // dropped
        {type: 'unset', path: [{_key: ROOT_KEY}, 'rows', {_key: 'r2'}]},
      ]
      const out = rerootPatches(patches)
      expect(out).toEqual([
        {type: 'set', path: ['rows', {_key: 'r1'}], value: 1},
        {type: 'unset', path: ['rows', {_key: 'r2'}]},
      ])
      expect(warn).toHaveBeenCalledTimes(2)
    })

    it('drops a whole-value set() without ever forwarding it', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const out = rerootPatches([{type: 'set', path: [] as Path, value: {clobbered: true}}])
      expect(out).toEqual([])
    })
  })
})
