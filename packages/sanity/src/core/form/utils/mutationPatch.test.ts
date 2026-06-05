import {describe, expect, it} from 'vitest'

import {fromMutationPatches, toMutationPatches} from './mutationPatch'
import {insert} from '../patch/patch'

describe('fromMutationPatches', () => {
  it('converts insert replace patches', () => {
    const patches = fromMutationPatches('remote', [
      {
        insert: {
          replace: 'array[asset._ref == "image-1"]',
          items: [{label: 'new'}],
        },
      },
    ])

    expect(patches).toEqual([
      {
        type: 'insert',
        position: 'replace',
        path: ['array', {asset: {_ref: 'image-1'}}],
        items: [{label: 'new'}],
        origin: 'remote',
      },
    ])
  })
})

describe('toMutationPatches', () => {
  it('serializes insert replace patches losslessly', () => {
    const formPatch = insert([{label: 'new'}], 'replace', ['array', {asset: {_ref: 'image-1'}}])
    const mutationPatches = toMutationPatches([formPatch])

    expect(mutationPatches).toEqual([
      {
        insert: {
          replace: 'array[asset._ref=="image-1"]',
          items: [{label: 'new'}],
        },
      },
    ])
  })

  it('round-trips a nested constraint path through encode and decode', () => {
    // Encode a form patch (built via the public helper) to a mutation patch...
    const formPatch = insert([{label: 'new'}], 'replace', ['array', {asset: {_ref: 'image-1'}}])
    const [mutationPatch] = toMutationPatches([formPatch])

    expect(mutationPatch).toEqual({
      insert: {
        replace: 'array[asset._ref=="image-1"]',
        items: [{label: 'new'}],
      },
    })

    // ...then decode it back and verify the path/items survive the round-trip.
    const [decoded] = fromMutationPatches('remote', [mutationPatch])

    expect(decoded).toMatchObject({
      type: 'insert',
      position: 'replace',
      path: ['array', {asset: {_ref: 'image-1'}}],
      items: [{label: 'new'}],
    })
  })
})
