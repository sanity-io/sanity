import {SanityDocument} from '@sanity/types'
import type {Observable} from 'rxjs'

export type DocumentValuePermission = 'read' | 'create' | 'update' | 'history' | 'editHistory'

export interface Grant {
  filter: string
  permissions: DocumentValuePermission[]
}

export interface PermissionCheckResult {
  granted: boolean
  reason: string
}

export interface GrantsStore {
  /**
   * Returns an observable of `PermissionCheckResult`
   *
   * This API is returns an observable (vs a promise) so the consumer can reac
   * to incoming changes to the user permissions (e.g. for changing _debug_
   * roles).
   *
   * This API also accepts a `null` document in which it should return
   * `granted: true`
   */
  checkDocumentPermission(
    checkPermissionName: DocumentValuePermission,
    document: Partial<SanityDocument> | null
  ): Observable<PermissionCheckResult>
}

export interface EvaluationParams {
  identity?: string
}
