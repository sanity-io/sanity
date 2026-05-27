import {type SanityClient} from '@sanity/client'

import {type EditableSystemVariant, type SystemVariant} from '../types'

export interface VariantOperationsStore {
  createVariant: (variant: EditableSystemVariant) => Promise<SystemVariant>
  updateVariant: (variant: EditableSystemVariant) => Promise<SystemVariant>
  deleteVariant: (variantId: string) => Promise<unknown>
}

/**
 * Temporary using the client with direct groq mutations, like create, set, delete...
 * Needs to be updated once we have the variant client actions.
 */
export function createVariantOperationsStore(options: {
  client: SanityClient
}): VariantOperationsStore {
  const {client} = options

  const handleCreateVariant = (variant: EditableSystemVariant) =>
    client.create(variant) as Promise<SystemVariant>

  const handleUpdateVariant = (variant: EditableSystemVariant) => {
    const setPayload: Pick<EditableSystemVariant, 'conditions' | 'priority'> &
      Partial<Pick<EditableSystemVariant, 'metadata'>> = {
      conditions: variant.conditions,
      priority: variant.priority,
    }

    if (variant.metadata) {
      setPayload.metadata = variant.metadata
    }

    const patch = client.patch(variant._id).set(setPayload)

    if (!variant.metadata) {
      patch.unset(['metadata'])
    }

    return patch.commit() as Promise<SystemVariant>
  }

  const handleDeleteVariant = (variantId: string) => client.delete(variantId)

  return {
    createVariant: handleCreateVariant,
    updateVariant: handleUpdateVariant,
    deleteVariant: handleDeleteVariant,
  }
}
