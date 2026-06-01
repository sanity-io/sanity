import {type BaseActionOptions, type SanityClient} from '@sanity/client'

import {type EditableSystemVariant} from '../types'

/**
 * Variant definition actions resolve to the transaction id of the submitted
 * mutation, not the affected document.
 */
export interface VariantDefinitionActionResult {
  transactionId: string
}

/**
 * Variant definition action payloads. See ../ACTIONS.md.
 *
 */
export interface VariantDefinitionCreateAction {
  actionType: 'sanity.action.variant.definition.create'
  variantId: string
  conditions?: EditableSystemVariant['conditions']
  priority?: number
  metadata?: EditableSystemVariant['metadata']
}

export interface VariantDefinitionEditAction {
  actionType: 'sanity.action.variant.definition.edit'
  variantId: string
  patch: {
    set: Pick<EditableSystemVariant, 'conditions' | 'priority'> &
      Partial<Pick<EditableSystemVariant, 'metadata'>>
    unset?: ['metadata']
  }
  ifRevisionId?: string
}

export interface VariantDefinitionDeleteAction {
  actionType: 'sanity.action.variant.definition.delete'
  variantId: string
  ifRevisionId?: string
}

export type VariantDefinitionAction =
  | VariantDefinitionCreateAction
  | VariantDefinitionEditAction
  | VariantDefinitionDeleteAction

/**
 * Temporary client typing until sanity/client exports variant definition actions.
 *
 */
export interface SanityClientWithVariantsActions extends Omit<SanityClient, 'action'> {
  action(
    action: VariantDefinitionAction,
    options?: BaseActionOptions,
  ): Promise<VariantDefinitionActionResult>
}

/**
 * Returns a client whose `action` method accepts variant definition actions.
 * Remove once sanity/client exports these action types.
 *
 */
export function variantsClient(client: SanityClient): SanityClientWithVariantsActions {
  return client as unknown as SanityClientWithVariantsActions
}
