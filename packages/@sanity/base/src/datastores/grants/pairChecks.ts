import {SanityDocument} from '@sanity/types'
import {Observable, combineLatest, of} from 'rxjs'

import {map} from 'rxjs/operators'
import {PermissionCheckResult} from './types'
import grantsStore from './index'

// Various checks that involves "document pairs" aka [published, draft] pairs

// in order to publish a document you need access to:
// - `delete` draft
// - `update` published (if it exists)
// - `create` published (if it does not exists)
export function checkPublishPermission(snapshots: {
  published: Partial<SanityDocument>
  draft: Partial<SanityDocument>
}): Observable<PermissionCheckResult> {
  return combineLatest(
    grantsStore.checkDocumentPermission('update', snapshots.draft),
    grantsStore.checkDocumentPermission('update', snapshots.published),
    grantsStore.checkDocumentPermission('create', snapshots.published)
  ).pipe(
    map(([deleteDraftPermission, updatePublishedPermission, createPublishedPermission]) => {
      const canDeleteDraft = deleteDraftPermission.granted

      const reason = [
        !canDeleteDraft && `draft version can't be deleted: ${deleteDraftPermission.reason}`,
        !updatePublishedPermission.granted &&
          `published version can't be updated: ${updatePublishedPermission.reason}`,
        !createPublishedPermission.granted &&
          `published version can't be updated: ${createPublishedPermission.reason}`,
      ]
        .filter(Boolean)
        .join(', ')
      return {
        granted:
          deleteDraftPermission.granted &&
          updatePublishedPermission.granted &&
          createPublishedPermission.granted,
        reason: reason ? `Cannot publish: ${reason}` : '',
      }
    })
  )
}

export function checkDeletePermission(snapshots: {
  published: Partial<SanityDocument>
  draft: Partial<SanityDocument>
}): Observable<PermissionCheckResult> {
  return combineLatest([
    grantsStore.checkDocumentPermission('update', snapshots.draft),
    // NOTE: most reliable way to check whether the document "exists" is currently to see if it has a `_rev`
    // If the published document exists, the user *only* need access to delete (update) the draft
    snapshots.published?._rev
      ? grantsStore.checkDocumentPermission('update', snapshots.published)
      : of({granted: true, reason: 'granted'}),
  ]).pipe(
    map(([deleteDraftPermission, deletePublishedPermission]) => {
      const reason = [
        deleteDraftPermission.granted &&
          `draft version can't be deleted: ${deleteDraftPermission.reason}`,
        deletePublishedPermission.granted &&
          `published version can't be deleted: ${deletePublishedPermission.reason}`,
      ]
        .filter(Boolean)
        .join(' and ')

      return {
        granted: deleteDraftPermission.granted && deletePublishedPermission.granted,
        reason: reason ? `Cannot publish: ${reason}` : '',
      }
    })
  )
}

// unpublish is deleting published and creating a draft
export function checkUnpublishPermission(snapshots: {
  published: Partial<SanityDocument>
  draft: Partial<SanityDocument>
}): Observable<PermissionCheckResult> {
  return combineLatest([
    grantsStore.checkDocumentPermission('create', snapshots.draft),
    grantsStore.checkDocumentPermission('update', snapshots.published),
  ]).pipe(
    map(([createDraftPermission, deletePublishedPermission]) => {
      const reason = [
        deletePublishedPermission.granted &&
          `published version can't be deleted: ${deletePublishedPermission.reason}`,
        createDraftPermission.granted &&
          `draft version can't be created: ${createDraftPermission.reason}`,
      ]
        .filter(Boolean)
        .join(' and ')

      return {
        granted: deletePublishedPermission.granted && createDraftPermission.granted,
        reason: reason ? `Cannot publish: ${reason}` : '',
      }
    })
  )
}
