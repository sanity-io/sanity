import {SanityDocument} from '@sanity/types'
import type {Observable} from 'rxjs'

export type DocumentPermissionName = 'read' | 'create' | 'update' | 'history' | 'editHistory'

export interface Grant {
  filter: string
  permissions: DocumentPermissionName[]
}

export interface PermissionCheckResult {
  granted: boolean
  reason: string
}

export interface GrantsStore {
  grants: Observable<Grant[]>
  checkDocumentPermission(
    checkPermissionName: DocumentPermissionName,
    document: Partial<SanityDocument>
  ): Observable<PermissionCheckResult>
}
