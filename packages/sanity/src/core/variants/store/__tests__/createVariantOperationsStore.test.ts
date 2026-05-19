import {describe, expect, it, vi} from 'vitest'

import {type EditableSystemVariant} from '../../types'
import {VARIANT_DOCUMENTS_PATH} from '../constants'
import {createVariantOperationsStore} from '../createVariantOperationsStore'

function createEditableVariant(): EditableSystemVariant {
  return {
    _id: `${VARIANT_DOCUMENTS_PATH}.Ab12cd34`,
    _type: 'system.variant',
    conditions: {audience: 'loyal-customers'},
    priority: 0,
    metadata: {
      title: 'Loyal customers',
      description: [],
    },
  }
}

describe('createVariantOperationsStore', () => {
  it('creates a variant document', async () => {
    const variant = createEditableVariant()
    const client = {
      create: vi.fn().mockResolvedValue(variant),
    }

    const store = createVariantOperationsStore({client: client as never})

    await expect(store.createVariant(variant)).resolves.toEqual(variant)
    expect(client.create).toHaveBeenCalledWith(variant)
  })

  it('updates a variant document', async () => {
    const variant = createEditableVariant()
    const patch = {
      set: vi.fn().mockReturnThis(),
      unset: vi.fn().mockReturnThis(),
      commit: vi.fn().mockResolvedValue(variant),
    }
    const client = {
      patch: vi.fn().mockReturnValue(patch),
    }

    const store = createVariantOperationsStore({client: client as never})

    await expect(store.updateVariant(variant)).resolves.toEqual(variant)

    expect(client.patch).toHaveBeenCalledWith(variant._id)
    expect(patch.set).toHaveBeenCalledWith({
      conditions: variant.conditions,
      metadata: variant.metadata,
      priority: variant.priority,
    })
    expect(patch.set).toHaveBeenCalledTimes(1)
    expect(patch.commit).toHaveBeenCalledTimes(1)
  })

  it('unsets metadata when updating a variant without metadata', async () => {
    const variant = createEditableVariant()
    const variantWithoutMetadata: EditableSystemVariant = {
      _id: variant._id,
      _type: variant._type,
      conditions: variant.conditions,
      priority: variant.priority,
    }
    const patch = {
      set: vi.fn().mockReturnThis(),
      unset: vi.fn().mockReturnThis(),
      commit: vi.fn().mockResolvedValue(variantWithoutMetadata),
    }
    const client = {
      patch: vi.fn().mockReturnValue(patch),
    }

    const store = createVariantOperationsStore({client: client as never})

    await expect(store.updateVariant(variantWithoutMetadata)).resolves.toEqual(
      variantWithoutMetadata,
    )

    expect(patch.unset).toHaveBeenCalledWith(['metadata'])
  })

  it('deletes a variant document', async () => {
    const client = {
      delete: vi.fn().mockResolvedValue(undefined),
    }

    const store = createVariantOperationsStore({client: client as never})

    await store.deleteVariant(`${VARIANT_DOCUMENTS_PATH}.Ab12cd34`)

    expect(client.delete).toHaveBeenCalledWith(`${VARIANT_DOCUMENTS_PATH}.Ab12cd34`)
  })
})
