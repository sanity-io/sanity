import {type BaseActionOptions, type SanityClient, type SingleActionResult} from '@sanity/client'
import {type SanityDocumentLike} from '@sanity/types'

import {type EditableSystemVariant} from '../types'

/**
 * Variant definition actions resolve to the transaction id of the submitted
 * mutation, not the affected document.
 */
export interface VariantDefinitionActionResult {
  transactionId: string
}

/** Supported bundle targets for variant document creation. Release names are not yet supported. */
export type VariantDocumentBundleId = '$published' | 'drafts'

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

interface VariantDocumentCreateActionBase {
  actionType: 'sanity.action.document.variant.create'
  publishedId: string
  variantId: string
  bundleId?: VariantDocumentBundleId
}

export interface VariantDocumentCreateFromDocumentAction extends VariantDocumentCreateActionBase {
  document: SanityDocumentLike
}

export interface VariantDocumentCreateFromBaseAction extends VariantDocumentCreateActionBase {
  baseId: string
  ifBaseRevisionId?: string
}

export type VariantDocumentCreateAction =
  | VariantDocumentCreateFromDocumentAction
  | VariantDocumentCreateFromBaseAction

export type VariantAction = VariantDefinitionAction | VariantDocumentCreateAction

/**
 * Temporary client typing until sanity/client exports variant actions.
 *
 */
export interface SanityClientWithVariantsActions extends Omit<SanityClient, 'action'> {
  action(
    action: VariantDefinitionAction,
    options?: BaseActionOptions,
  ): Promise<VariantDefinitionActionResult>
  action(
    action: VariantDocumentCreateAction,
    options?: BaseActionOptions,
  ): Promise<SingleActionResult>
  action(
    action: VariantAction,
    options?: BaseActionOptions,
  ): Promise<VariantDefinitionActionResult | SingleActionResult>
}

/**
 * Returns a client whose `action` method accepts variant actions.
 * Remove once sanity/client exports these action types.
 *
 */
export function variantsClient(client: SanityClient): SanityClientWithVariantsActions {
  return client as unknown as SanityClientWithVariantsActions
}
