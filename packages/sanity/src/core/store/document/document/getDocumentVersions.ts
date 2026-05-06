/* eslint-disable max-nested-callbacks */
import {getVersionFromId, isDraftId} from '@sanity/client/csm'
import {map, switchMap, type Observable} from 'rxjs'

import {type DocumentPreviewStore} from '../../../preview'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {isNonNullable} from '../../../util'
import {memoize} from '../utils/createMemoizer'
import {type DocumentTarget} from './types'
import {getDocumentMemoizeKey} from './utils'

interface DocumentVersion {
  _id: string
  _type: string
  _rev: string
  _system: Record<string, unknown> & {
    bundleId: 'drafts' | 'published' | (string & {})
    variantId?: string // corresponds to variant definition
    compositeId?: string // unique ID used in `_id`, eg. versions.asdf123.docId
  }
}

const findPublishedVariant = (target: DocumentTarget, versions: DocumentVersion[]) => {
  return versions.find((version) => {
    return (
      version._system.variantId === target.variantId && version._system.bundleId === 'published'
    )
  })
}

const findDraftVariant = (target: DocumentTarget, versions: DocumentVersion[]) => {
  return versions.find((version) => {
    return version._system.variantId === target.variantId && version._system.bundleId === 'drafts'
  })
}

export const getDocumentVersions = memoize(
  (
    target: DocumentTarget,
    documentPreviewStore: DocumentPreviewStore,
  ): Observable<{
    publishedId: string | undefined
    draftId: string | undefined
  }> => {
    // TODO: Move this to a shared location to memoize it indepently of the resolved document, and do it per base document id
    // TODO: Make this into a observable that gets the document id, type and `_system` fields
    const documentVersions$ = documentPreviewStore
      .unstable_observeDocumentIdSet(
        `sanity::versionOf($baseId)`,
        {baseId: target.baseId},
        {apiVersion: DEFAULT_STUDIO_CLIENT_OPTIONS.apiVersion},
      )
      .pipe(
        switchMap((result) => {
          // TODO: Use the paths preview observer to get only the necessary paths?
          return documentPreviewStore.unstable_observeDocuments(result.documentIds).pipe(
            map((documents) =>
              documents.filter(isNonNullable).map((document) => {
                // TODO: This should come from the api.
                const release = getVersionFromId(document._id)
                const variant = undefined // <-- not implemented yet
                return {
                  _id: document._id,
                  _type: document._type,
                  _rev: document._rev,
                  _system: {
                    bundleId: release ? release : isDraftId(document._id) ? 'draft' : 'published',
                    variantId: variant,
                    ...(document._system as Record<string, unknown>),
                  },
                } satisfies DocumentVersion
              }),
            ),
            map((documents) => ({
              publishedId: findPublishedVariant(target, documents)?._id,
              draftId: findDraftVariant(target, documents)?._id,
            })),
          )
        }),
      )
    return documentVersions$
  },
  (target) => getDocumentMemoizeKey(undefined, target.baseId, target.bundleId, target.variantId),
)
