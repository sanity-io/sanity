/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  PublishAction,
  DiscardChangesAction,
  UnpublishAction,
  DuplicateAction,
  DeleteAction
} from './defaultDocumentActions'
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import schema from 'part:@sanity/base/schema'

// todo: this should be replaced with the defaultResolveDocumentActions function from ./defaultDocumentActions eventually,
// it is kept here for now to preserve backwards compatibility with __experimental_actions
export default function resolveDocumentActions(props) {
  const schemaType = schema.get(props.type)
  return [
    isActionEnabled(schemaType, 'publish') && PublishAction,
    isActionEnabled(schemaType, 'delete') && DiscardChangesAction,
    isActionEnabled(schemaType, 'delete') && UnpublishAction,
    isActionEnabled(schemaType, 'create') && DuplicateAction,
    isActionEnabled(schemaType, 'delete') && DeleteAction
  ].filter(Boolean)
}
