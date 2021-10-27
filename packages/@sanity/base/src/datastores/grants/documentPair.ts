/* these methods deal with the draft / published pair of documents */

// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {SanityDocument, SchemaType} from '@sanity/types'
import {mergeMap, switchMap, tap} from 'rxjs/operators'
import {combineLatest} from 'rxjs'
import schema from 'part:@sanity/base/schema'
import {getDraftId} from 'part:@sanity/base/util/draft-utils'

import {snapshotPair} from '../document/document-pair/snapshotPair'
import {IdPair} from '../document/types'
import {getPublishedId} from '../../util/draftUtils'
import {checkDeletePermission, checkPublishPermission, checkUnpublishPermission} from './pairChecks'
import grantsStore from '.'

function getSchemaType(typeName: string): SchemaType {
  const type = schema.get(typeName)
  if (!type) {
    throw new Error(`No such schema type: ${typeName}`)
  }
  return type
}

export function canCreateType(document: Partial<SanityDocument>) {
  const type = getSchemaType(document._type)
  const id = document._id
  return grantsStore.checkDocumentPermission('create', {
    ...document,
    _id: type.liveEdit ? id : `drafts.${id}`,
    type,
  })
}

export function canUpdate(document: Partial<SanityDocument>) {
  const type = getSchemaType(document._type)
  const idPair = getIdPairFromPublished(document._id)
  return type.liveEdit
    ? grantsStore.checkDocumentPermission('update', document)
    : grantsStore.checkDocumentPermission(
        'update',
        // note: we check against the published document (if it exist) with draft id since that's the
        // document that will be created as new draft when user edits it
        {...document, _id: idPair.draftId}
      )
}

export function canDelete(document: Partial<SanityDocument>) {
  const type = getSchemaType(document._type)
  const idPair = getIdPairFromPublished(document._id)
  return snapshotPair(idPair).pipe(
    mergeMap((pair) => combineLatest([pair.draft.snapshots$, pair.published.snapshots$])),
    switchMap(([draft, published]) => {
      return type.liveEdit
        ? grantsStore.checkDocumentPermission('update', published)
        : checkDeletePermission({draft, published})
    })
  )
}

export function canPublish(document: Partial<SanityDocument>) {
  const idPair = getIdPairFromPublished(document._id)
  return snapshotPair(idPair).pipe(
    mergeMap((pair) => combineLatest([pair.draft.snapshots$, pair.published.snapshots$])),
    switchMap(([draft, published]) => {
      return checkPublishPermission({draft, published})
    })
  )
}

export function canUnpublish(document: Partial<SanityDocument>) {
  const idPair = getIdPairFromPublished(document._id)
  return snapshotPair(idPair).pipe(
    mergeMap((pair) => combineLatest([pair.draft.snapshots$, pair.published.snapshots$])),
    switchMap(([draft, published]) => {
      return checkUnpublishPermission({draft, published})
    })
  )
}

export function canDiscardDraft(document: Partial<SanityDocument>) {
  const idPair = getIdPairFromPublished(document._id)
  return snapshotPair(idPair).pipe(
    mergeMap((pair) => pair.draft.snapshots$),
    switchMap((draft) => grantsStore.checkDocumentPermission('update', draft))
  )
}

function getIdPairFromPublished(documentId: string): IdPair {
  return {publishedId: getPublishedId(documentId), draftId: getDraftId(documentId)}
}
