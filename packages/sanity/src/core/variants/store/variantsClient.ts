import {
  type BaseActionOptions,
  type ObservableSanityClient,
  type SanityClient,
  type SingleActionResult,
} from '@sanity/client'
import {type SanityDocumentLike} from '@sanity/types'
import {type Observable} from 'rxjs'

import {type EditableSystemVariant} from '../types'

/**
 * Variant definition actions resolve to the transaction id of the submitted
 * mutation, not the affected document.
 */
export interface VariantDefinitionActionResult {
  transactionId: string
}

/** Supported bundle targets for variant document creation. Release names are not yet supported. */
export type VariantDocumentBundleId = undefined | 'drafts'

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

/**
 * Publishes a variant-scoped version into the variant-of-published document.
 * `bundleId` is the SOURCE bundle being published (`'drafts'` or a release name);
 * `'published'` is rejected by the API (target equals source).
 */
export interface VariantDocumentPublishAction {
  actionType: 'sanity.action.document.variant.publish'
  publishedId: string
  variantId: string
  bundleId: 'drafts' | (string & {})
  /**
   * Optimistic lock on the source variant document's revision.
   * Note: specced but not accepted by the deployed action yet (`json: unknown field`).
   */
  ifSourceRevisionId?: string
  /**
   * Optimistic lock on the variant-of-published target's revision.
   * Note: specced but not accepted by the deployed action yet.
   */
  ifPublishedRevisionId?: string
}

/**
 * Unpublishes a variant document. `bundleId` addresses the variant version being unpublished:
 *
 * - `undefined` — the variant-of-published document: hard unpublish (the published variant is
 *   deleted and its content recreated as the variant draft), mirroring base unpublish.
 * - a release name — a release-scoped variant: soft unpublish (`_system.delete: true` marker),
 *   completed when the release is published.
 *
 * `'drafts'` is not a valid target: a drafts-scoped variant has nothing published to unpublish.
 * The explicit `undefined` (rather than an optional field) forces callers to consciously choose
 * the published variant. See CLDX-5781 / SAPP-4012.
 */
export interface VariantDocumentUnpublishAction {
  actionType: 'sanity.action.document.variant.unpublish'
  publishedId: string
  variantId: string
  bundleId: undefined | (string & {})
}

/**
 * Deletes a variant-scoped version document in the given bundle
 * (omitted `bundleId` targets the variant-of-published document).
 */
export interface VariantDocumentDeleteAction {
  actionType: 'sanity.action.document.variant.delete'
  publishedId: string
  variantId: string
  bundleId?: 'drafts' | (string & {})
  /** Also removes history from the translog. Defaults to false. */
  purge?: boolean
}

export type VariantDocumentAction =
  | VariantDocumentCreateAction
  | VariantDocumentPublishAction
  | VariantDocumentUnpublishAction
  | VariantDocumentDeleteAction

export type VariantAction = VariantDefinitionAction | VariantDocumentAction

/**
 * Temporary observable client typing until sanity/client exports variant actions.
 */
export interface ObservableSanityClientWithVariantsActions extends Omit<
  ObservableSanityClient,
  'action'
> {
  action(
    action: VariantDefinitionAction,
    options?: BaseActionOptions,
  ): Observable<VariantDefinitionActionResult>
  action(action: VariantDocumentAction, options?: BaseActionOptions): Observable<SingleActionResult>
  action(
    action: VariantAction,
    options?: BaseActionOptions,
  ): Observable<VariantDefinitionActionResult | SingleActionResult>
}

/**
 * Temporary client typing until sanity/client exports variant actions.
 */
export interface SanityClientWithVariantsActions extends Omit<
  SanityClient,
  'action' | 'observable'
> {
  action(
    action: VariantDefinitionAction,
    options?: BaseActionOptions,
  ): Promise<VariantDefinitionActionResult>
  action(action: VariantDocumentAction, options?: BaseActionOptions): Promise<SingleActionResult>
  action(
    action: VariantAction,
    options?: BaseActionOptions,
  ): Promise<VariantDefinitionActionResult | SingleActionResult>
  observable: ObservableSanityClientWithVariantsActions
}

/**
 * Returns a client whose `action` and `observable.action` methods accept variant actions.
 * Remove once sanity/client exports these action types.
 */
export function variantsClient(client: SanityClient): SanityClientWithVariantsActions {
  return client as unknown as SanityClientWithVariantsActions
}
