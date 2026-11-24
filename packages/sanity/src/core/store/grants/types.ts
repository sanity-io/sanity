import {type SanityDocument} from '@sanity/types'
import {type Observable} from 'rxjs'

/**
 * The document operations a grant can allow: read, create, update, and viewing or editing history.
 *
 * @public
 */
export type DocumentValuePermission = 'read' | 'create' | 'update' | 'history' | 'editHistory'

/** @internal */
export interface Grant {
  filter: string
  permissions: DocumentValuePermission[]
}

/**
 * The outcome of a permission check: whether it was `granted`, and the `reason`.
 *
 * @public
 */
export interface PermissionCheckResult {
  granted: boolean
  reason: string
}

/**
 * Checks the current user's permissions on documents. Get one with {@link useGrantsStore}.
 *
 * @public
 */
export interface GrantsStore {
  /**
   * Returns an observable of `PermissionCheckResult`
   *
   * This API is returns an observable (vs a promise) so the consumer can react
   * to incoming changes to the user permissions (e.g. for changing _debug_
   * roles).
   *
   * This API also accepts a `null` document in which it should return
   * `granted: true`
   */
  checkDocumentPermission(
    checkPermissionName: DocumentValuePermission,
    document: Partial<SanityDocument> | null,
  ): Observable<PermissionCheckResult>
}

/** @internal */
export interface EvaluationParams {
  identity?: string
}
