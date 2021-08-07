// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {SanityDocument, SchemaType} from '@sanity/types'
import {resolveInitialValueForType} from '@sanity/initial-value-templates'
import {map, mergeMap, switchMap} from 'rxjs/operators'
import {combineLatest, from} from 'rxjs'
import schema from 'part:@sanity/base/schema'
import {getDraftId, isDraftId} from 'part:@sanity/base/util/draft-utils'

import {snapshotPair} from '../document/document-pair/snapshotPair'
import {IdPair} from '../document/types'
import {checkDeletePermission, checkPublishPermission, checkUnpublishPermission} from './pairChecks'
import grantsStore from './'

function getSchemaType(typeName: string): SchemaType {
  const type = schema.get(typeName)
  if (!type) {
    throw new Error(`No such schema type: ${typeName}`)
  }
  return type
}

export function canCreateType(id: string, typeName: string) {
  const type = getSchemaType(typeName)
  return from(resolveInitialValueForType(type)).pipe(
    mergeMap((initialValue: any) => {
      return grantsStore.checkDocumentPermission('create', {
        ...initialValue,
        _id: type.liveEdit ? id : `drafts.${id}`,
        _type: typeName,
      })
    })
  )
}

export function canCreateAnyOf(types: string[]) {
  return combineLatest(types.map((typeName) => canCreateType('dummy-id', typeName))).pipe(
    map((results) => {
      const granted = results.some((res) => res.granted)
      return {
        granted,
        reason: granted
          ? 'can create at least one document type'
          : 'cannot create any document type',
      }
    })
  )
}

function stub(id: string, type: string): Partial<SanityDocument> {
  return {_id: id, _type: type}
}

export function canUpdate(id: string, typeName: string) {
  const type = getSchemaType(typeName)
  const idPair = getIdPairFromPublished(id)
  return snapshotPair(idPair).pipe(
    mergeMap((pair) => combineLatest([pair.draft.snapshots$, pair.published.snapshots$])),
    switchMap(([draft, published]) => {
      return type.liveEdit
        ? grantsStore.checkDocumentPermission(
            'update',
            published || stub(idPair.publishedId, typeName)
          )
        : grantsStore.checkDocumentPermission(
            'update',
            // note: we check against the published document (if it exist) here since that's the
            // document that will be created as new draft when user edits it
            draft || published || stub(idPair.draftId, typeName)
          )
    })
  )
}

export function canDelete(id: string, typeName: string) {
  const type = getSchemaType(typeName)
  const idPair = getIdPairFromPublished(id)
  return snapshotPair(idPair).pipe(
    mergeMap((pair) => combineLatest([pair.draft.snapshots$, pair.published.snapshots$])),
    map(([draft, published]) => [
      draft || stub(idPair.draftId, typeName),
      published || stub(idPair.publishedId, typeName),
    ]),
    switchMap(([draft, published]) => {
      return type.liveEdit
        ? grantsStore.checkDocumentPermission('update', published)
        : checkDeletePermission({draft, published})
    })
  )
}

export function canPublish(id: string, typeName: string) {
  const idPair = getIdPairFromPublished(id)
  return snapshotPair(idPair).pipe(
    mergeMap((pair) => combineLatest([pair.draft.snapshots$, pair.published.snapshots$])),
    map(([draft, published]) => [
      draft || stub(idPair.draftId, typeName),
      published || stub(idPair.publishedId, typeName),
    ]),
    switchMap(([draft, published]) => {
      return checkPublishPermission({draft, published})
    })
  )
}

export function canUnpublish(id: string, typeName: string) {
  const idPair = getIdPairFromPublished(id)
  return snapshotPair(idPair).pipe(
    mergeMap((pair) => combineLatest([pair.draft.snapshots$, pair.published.snapshots$])),
    map(([draft, published]) => [
      draft || stub(idPair.draftId, typeName),
      published || stub(idPair.publishedId, typeName),
    ]),
    switchMap(([draft, published]) => {
      return checkUnpublishPermission({draft, published})
    })
  )
}

export function canDiscardDraft(id: string, typeName: string) {
  const idPair = getIdPairFromPublished(id)
  return snapshotPair(idPair).pipe(
    mergeMap((pair) => pair.draft.snapshots$),
    map((draft) => draft || stub(idPair.draftId, typeName)),
    switchMap((draft) => grantsStore.checkDocumentPermission('update', draft))
  )
}

function getIdPairFromPublished(publishedId: string): IdPair {
  if (isDraftId(publishedId)) {
    throw new Error('editOpsOf does not expect a draft id.')
  }

  return {publishedId, draftId: getDraftId(publishedId)}
}
