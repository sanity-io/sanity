import {describe, expect, it} from 'vitest'

import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {type SystemVariant} from '../../types'
import {getDuplicatedVariant} from '../getDuplicatedVariant'
import {createPortableTextDescription} from '../variantDefaults'
import {DEFAULT_VARIANT_TYPE_KEY} from '../variantType'

const source: SystemVariant = {
  ...variantAlphaAudience,
  priority: 7,
  metadata: {
    title: 'Alpha audience',
    description: createPortableTextDescription('People in the alpha program'),
    type: 'audience',
    color: 'blue',
  },
}

describe('getDuplicatedVariant', () => {
  it('gives the duplicate a new id and the given title', () => {
    const duplicate = getDuplicatedVariant(source, 'Alpha audience (duplicated)')

    expect(duplicate._id).not.toBe(source._id)
    expect(duplicate._id.startsWith('_.variants.')).toBe(true)
    expect(duplicate.metadata?.title).toBe('Alpha audience (duplicated)')
  })

  it('copies the conditions, priority, type, description and other metadata', () => {
    const duplicate = getDuplicatedVariant(source, 'Copy')

    expect(duplicate).toEqual({
      _id: duplicate._id,
      _type: 'system.variant',
      conditions: {audience: 'alpha', locale: 'en-US'},
      priority: 7,
      metadata: {
        title: 'Copy',
        description: source.metadata?.description,
        type: 'audience',
        color: 'blue',
      },
    })
  })

  it('does not share the conditions object with the original', () => {
    const duplicate = getDuplicatedVariant(source, 'Copy')

    expect(duplicate.conditions).not.toBe(source.conditions)
  })

  it('writes the default type when the original has none', () => {
    const duplicate = getDuplicatedVariant({...source, metadata: {title: 'Untyped'}}, 'Copy')

    expect(duplicate.metadata?.type).toBe(DEFAULT_VARIANT_TYPE_KEY)
  })
})
