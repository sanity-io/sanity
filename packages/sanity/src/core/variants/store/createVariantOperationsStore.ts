import {
  type Action,
  type BaseActionOptions,
  type CreateVariantDefinitionAction,
  type SingleActionResult,
  type SanityClient,
} from '@sanity/client'

import {variantsApiClient} from '../../store/document/document-pair/utils/variantsApiClient'
import {getVariantId} from '../tool/util'
import {type EditableSystemVariant, type SystemVariant, type VariantCondition} from '../types'

/**
 * `@sanity/client` still types `conditions` as the legacy object shape (`ClientVariantConditions`).
 * TODO: drop this once the client types the array shape.
 */
type CreateVariantDefinitionArrayAction = Omit<CreateVariantDefinitionAction, 'conditions'> & {
  conditions: VariantCondition[]
}

/**
 * How long the mocked migration takes, so the pending state is visible.
 * TODO: remove with the mock once the migration action exists.
 */
const MOCK_MIGRATION_DELAY = 800

export interface VariantOperationsStore {
  createVariant: (variant: EditableSystemVariant) => Promise<SingleActionResult>
  updateVariant: (variant: EditableSystemVariant) => Promise<SingleActionResult>
  /**
   * `opts` are forwarded to the action request, so the permissions store can `dryRun` the
   * delete to find out whether the current user is allowed to perform it.
   */
  deleteVariant: (variantId: string, opts?: BaseActionOptions) => Promise<SingleActionResult>
  /**
   * Rewrites the `conditions` of definitions still in the legacy object shape to the array shape.
   * `opts` are forwarded the same way as for `deleteVariant`.
   *
   * Mocked: Content Lake has no action for this yet, so nothing is written.
   */
  migrateVariantConditions: (variants: SystemVariant[], opts?: BaseActionOptions) => Promise<void>
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
    const action: CreateVariantDefinitionArrayAction = {
      actionType: 'sanity.action.variant.definition.create',
      variantId,
      conditions: variant.conditions,
      priority: variant.priority,
      ...(variant.metadata ? {metadata: variant.metadata} : {}),
    }

    return await client.action(action as unknown as Action, {tag: 'variants.create'})
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

  // TODO: replace with the Content Lake patch action once it is available: one action per
  // definition in `variants`, each setting `conditions` to the normalized array.
  const handleMigrateVariantConditions = async (
    _variants: SystemVariant[],
    opts?: BaseActionOptions,
  ): Promise<void> => {
    if (opts?.dryRun) {
      return
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, MOCK_MIGRATION_DELAY)
    })
  }

  return {
    createVariant: handleCreateVariant,
    updateVariant: handleUpdateVariant,
    deleteVariant: handleDeleteVariant,
    migrateVariantConditions: handleMigrateVariantConditions,
  }
}
