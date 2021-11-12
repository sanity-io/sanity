/* these methods deal with the draft / published pair of documents */

// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {SanityDocument, SchemaType} from '@sanity/types'
import schema from 'part:@sanity/base/schema'

import {getPublishedId, getDraftId} from '../../util/draftUtils'
import {checkPublishPermission} from './pairChecks'
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
  const draft = {...document, _id: getDraftId(document._id)}
  return type.liveEdit
    ? grantsStore.checkDocumentPermission('update', document)
    : grantsStore.checkDocumentPermission(
        'update',
        // note: we check against the published document (if it exist) with draft id since that's the
        // document that will be created as new draft when user edits it
        {...document, _id: draft._id}
      )
}

export function canPublish(document: Partial<SanityDocument>) {
  const published = {...document, _id: getPublishedId(document._id)}
  const draft = {...document, _id: getDraftId(document._id)}
  return checkPublishPermission({published, draft})
}
