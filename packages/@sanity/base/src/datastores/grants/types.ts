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
  checkDocumentPermission(
    checkPermissionName: DocumentValuePermission,
    document: Partial<SanityDocument>
  ): Observable<PermissionCheckResult>
}

export interface EvaluationParams {
  identity?: string
}
