import {type SanityClient} from '@sanity/client'
import {describe, expect, it, vi} from 'vitest'

import {type EditableSystemVariant, type VariantDefinitionDocument} from '../../types'
import {VARIANT_DOCUMENTS_PATH} from '../constants'
import {createVariantOperationsStore} from '../createVariantOperationsStore'

const VARIANT_ID = 'Ab12cd34'
const DOCUMENT_ID = `${VARIANT_DOCUMENTS_PATH}.${VARIANT_ID}`

function createEditableVariant(): EditableSystemVariant {
  return {
    _id: DOCUMENT_ID as `_.variants.${string}`,
    _type: 'system.variant',
    conditions: {audience: 'loyal-customers'},
    priority: 0,
    metadata: {
      title: 'Loyal customers',
      description: [],
    },
  }
}

function createVariantDefinitionDocument(
  variant: EditableSystemVariant,
): VariantDefinitionDocument {
  return {
    ...variant,
    name: VARIANT_ID,
    _rev: 'rev-1',
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
  }
}

describe('createVariantOperationsStore', () => {
  it('creates a variant definition with the create action', async () => {
    const variant = createEditableVariant()
    const persistedVariant = createVariantDefinitionDocument(variant)
    const client = {
      action: vi.fn().mockResolvedValue(persistedVariant),
    }

    const store = createVariantOperationsStore({client: client as SanityClient})

    await expect(store.createVariant(variant)).resolves.toEqual(persistedVariant)
    expect(client.action).toHaveBeenCalledWith(
      {
        actionType: 'sanity.action.variant.definition.create',
        variantId: VARIANT_ID,
        conditions: variant.conditions,
        priority: variant.priority,
        metadata: variant.metadata,
      },
      {tag: 'variants.create'},
    )
  })

  it('updates a variant definition with the edit action', async () => {
    const variant = createEditableVariant()
    const persistedVariant = createVariantDefinitionDocument(variant)
    const client = {
      action: vi.fn().mockResolvedValue(persistedVariant),
    }

    const store = createVariantOperationsStore({client: client as SanityClient})

    await expect(store.updateVariant(variant)).resolves.toEqual(persistedVariant)

    expect(client.action).toHaveBeenCalledWith(
      {
        actionType: 'sanity.action.variant.definition.edit',
        variantId: VARIANT_ID,
        patch: {
          set: {
            conditions: variant.conditions,
            metadata: variant.metadata,
            priority: variant.priority,
          },
        },
      },
      {tag: 'variants.edit'},
    )
  })

  it('unsets metadata when updating a variant without metadata', async () => {
    const variant = createEditableVariant()
    const variantWithoutMetadata: EditableSystemVariant = {
      _id: variant._id,
      _type: variant._type,
      conditions: variant.conditions,
      priority: variant.priority,
    }
    const persistedVariant = createVariantDefinitionDocument(variantWithoutMetadata)
    const client = {
      action: vi.fn().mockResolvedValue(persistedVariant),
    }

    const store = createVariantOperationsStore({client: client as SanityClient})

    await expect(store.updateVariant(variantWithoutMetadata)).resolves.toEqual(persistedVariant)

    expect(client.action).toHaveBeenCalledWith(
      {
        actionType: 'sanity.action.variant.definition.edit',
        variantId: VARIANT_ID,
        patch: {
          set: {
            conditions: variantWithoutMetadata.conditions,
            priority: variantWithoutMetadata.priority,
          },
          unset: ['metadata'],
        },
      },
      {tag: 'variants.edit'},
    )
  })

  it('deletes a variant definition with the delete action', async () => {
    const variant = createEditableVariant()
    const persistedVariant = createVariantDefinitionDocument(variant)
    const client = {
      action: vi.fn().mockResolvedValue(persistedVariant),
    }

    const store = createVariantOperationsStore({client: client as SanityClient})

    await expect(store.deleteVariant(DOCUMENT_ID)).resolves.toEqual(persistedVariant)

    expect(client.action).toHaveBeenCalledWith(
      {
        actionType: 'sanity.action.variant.definition.delete',
        variantId: VARIANT_ID,
      },
      {tag: 'variants.delete'},
    )
  })
})
