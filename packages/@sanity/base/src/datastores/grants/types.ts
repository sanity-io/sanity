import {SanityDocument} from '@sanity/types'
import type {Observable} from 'rxjs'

export type DocumentPermissionName = 'read' | 'create' | 'update' | 'history' | 'editHistory'

export const DOCUMENT_FILTER_RULE_KEY = 'sanity.document.filter' as const

export interface Grant {
  name: DocumentPermissionName
  params: Record<string, unknown>
}

export interface DocumentFilterRule {
  grants: Grant[]
  config?: {
    filter: string
  }
}

export interface PermissionCheckResult {
  granted: boolean
  reason: string
}

export interface DatasetGrants {
  [DOCUMENT_FILTER_RULE_KEY]: DocumentFilterRule[]
  // add more here if needed
}

export interface GrantsStore {
  checkDocumentPermission(
    checkPermissionName: DocumentPermissionName,
    document: Partial<SanityDocument>
  ): Observable<PermissionCheckResult>
}
