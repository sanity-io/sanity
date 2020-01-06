import {
  PublishAction,
  DiscardChangesAction,
  UnpublishAction,
  DuplicateAction,
  DeleteAction
} from './defaultActions'
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import schema from 'part:@sanity/base/schema'

export default function resolveDocumentActions(documentState) {
  const schemaType = schema.get(documentState.type)
  return [
    isActionEnabled(schemaType, 'publish') && PublishAction,
    isActionEnabled(schemaType, 'delete') && DiscardChangesAction,
    isActionEnabled(schemaType, 'delete') && UnpublishAction,
    isActionEnabled(schemaType, 'create') && DuplicateAction,
    isActionEnabled(schemaType, 'delete') && DeleteAction
  ].filter(Boolean)
}
