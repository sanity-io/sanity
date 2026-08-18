import {type SanityClient} from '@sanity/client'

import {getVariantId} from '../tool/util'
import {type EditableSystemVariant} from '../types'
import {variantsClient, type VariantDefinitionActionResult} from './variantsClient'

export interface VariantOperationsStore {
  createVariant: (variant: EditableSystemVariant) => Promise<VariantDefinitionActionResult>
  updateVariant: (variant: EditableSystemVariant) => Promise<VariantDefinitionActionResult>
  deleteVariant: (variantId: string) => Promise<VariantDefinitionActionResult>
}

/**
 * Variant definition writes use the actions API. See ../ACTIONS.md.
 */
export function createVariantOperationsStore(options: {
  client: SanityClient
}): VariantOperationsStore {
  const client = variantsClient(options.client)

  const handleCreateVariant = async (variant: EditableSystemVariant) => {
    const variantId = getVariantId(variant._id)
    const action = {
      actionType: 'sanity.action.variant.definition.create' as const,
      variantId,
      conditions: variant.conditions,
      priority: variant.priority,
      ...(variant.metadata ? {metadata: variant.metadata} : {}),
    }

    return await client.action(action, {tag: 'variants.create'})
  }

  const handleUpdateVariant = async (variant: EditableSystemVariant) => {
    const variantId = getVariantId(variant._id)
    const setPayload: Pick<EditableSystemVariant, 'conditions' | 'priority'> &
      Partial<Pick<EditableSystemVariant, 'metadata'>> = {
      conditions: variant.conditions,
      priority: variant.priority,
    }

    if (variant.metadata) {
      setPayload.metadata = variant.metadata
    }

    const patch: {
      set: typeof setPayload
      unset?: ['metadata']
    } = {
      set: setPayload,
    }

    if (!variant.metadata) {
      patch.unset = ['metadata']
    }

    const action = {
      actionType: 'sanity.action.variant.definition.edit' as const,
      variantId,
      patch,
    }

    return await client.action(action, {tag: 'variants.edit'})
  }

  const handleDeleteVariant = async (variantIdOrDocumentId: string) => {
    const action = {
      actionType: 'sanity.action.variant.definition.delete' as const,
      variantId: getVariantId(variantIdOrDocumentId),
    }

    return await client.action(action, {tag: 'variants.delete'})
  }

  return {
    createVariant: handleCreateVariant,
    updateVariant: handleUpdateVariant,
    deleteVariant: handleDeleteVariant,
  }
}
