import {type BaseActionOptions, type SingleActionResult, type SanityClient} from '@sanity/client'

import {variantsApiClient} from '../../store/document/document-pair/utils/variantsApiClient'
import {getVariantId} from '../tool/util'
import {type EditableSystemVariant} from '../types'

export interface VariantOperationsStore {
  createVariant: (variant: EditableSystemVariant) => Promise<SingleActionResult>
  updateVariant: (variant: EditableSystemVariant) => Promise<SingleActionResult>
  /**
   * `opts` are forwarded to the action request, so the permissions store can `dryRun` the
   * delete to find out whether the current user is allowed to perform it.
   */
  deleteVariant: (variantId: string, opts?: BaseActionOptions) => Promise<SingleActionResult>
}

/**
 * Variant definition writes use the actions API. See ../ACTIONS.md.
 */
export function createVariantOperationsStore(options: {
  client: SanityClient
}): VariantOperationsStore {
  const client = variantsApiClient(options.client)

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

  const handleDeleteVariant = async (variantIdOrDocumentId: string, opts?: BaseActionOptions) => {
    const action = {
      actionType: 'sanity.action.variant.definition.delete' as const,
      variantId: getVariantId(variantIdOrDocumentId),
    }

    return await client.action(action, {tag: 'variants.delete', ...opts})
  }

  return {
    createVariant: handleCreateVariant,
    updateVariant: handleUpdateVariant,
    deleteVariant: handleDeleteVariant,
  }
}
