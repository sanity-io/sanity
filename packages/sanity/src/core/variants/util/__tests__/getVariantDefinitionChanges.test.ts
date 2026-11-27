import {describe, expect, it} from 'vitest'

import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {type EditableSystemVariant} from '../../types'
import {getVariantDefinitionChanges} from '../getVariantDefinitionChanges'

const previous: EditableSystemVariant = {
  _id: variantAlphaAudience._id,
  _type: variantAlphaAudience._type,
  conditions: variantAlphaAudience.conditions,
  priority: variantAlphaAudience.priority,
  metadata: variantAlphaAudience.metadata,
}

const description = [
  {
    _key: 'block',
    _type: 'block',
    children: [{_key: 'span', _type: 'span', marks: [], text: 'Repeat visitors'}],
    markDefs: [],
    style: 'normal',
  },
]

describe('getVariantDefinitionChanges', () => {
  it('reports nothing changed for an unchanged definition', () => {
    expect(getVariantDefinitionChanges(previous, {...previous})).toEqual({
      titleChanged: false,
      descriptionChanged: false,
      conditionsChanged: false,
      priorityChanged: false,
    })
  })

  it('compares conditions by value, not key order', () => {
    const reordered = {...previous, conditions: {locale: 'en-US', audience: 'alpha'}}

    expect(getVariantDefinitionChanges(previous, reordered).conditionsChanged).toBe(false)
  })

  it('reports each changed part of the definition', () => {
    const next: EditableSystemVariant = {
      ...previous,
      conditions: {...previous.conditions, market: 'nordics'},
      priority: previous.priority + 1,
      metadata: {...previous.metadata, title: 'Alpha visitors', description},
    }

    expect(getVariantDefinitionChanges(previous, next)).toEqual({
      titleChanged: true,
      descriptionChanged: true,
      conditionsChanged: true,
      priorityChanged: true,
    })
  })

  it('treats a missing title as an empty one', () => {
    const untitled = {...previous, metadata: {...previous.metadata, title: ''}}
    const withoutTitle = {...previous, metadata: {description: previous.metadata?.description}}

    expect(getVariantDefinitionChanges(untitled, withoutTitle).titleChanged).toBe(false)
  })
})
