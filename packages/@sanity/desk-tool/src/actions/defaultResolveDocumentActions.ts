import {DocumentActionComponent} from '@sanity/base'
import schema from 'part:@sanity/base/schema'
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import {
  PublishAction,
  DiscardChangesAction,
  UnpublishAction,
  DuplicateAction,
  DeleteAction,
} from './defaultDocumentActions'

// NOTE: this is a small utility function to avoid having to _cast_ the
// filtered array below to `DocumentActionComponent[]`.
function isDocumentAction(
  value: DocumentActionComponent | false
): value is DocumentActionComponent {
  return value !== false
}

// todo: this should be replaced with the defaultResolveDocumentActions function from ./defaultDocumentActions eventually,
// it is kept here for now to preserve backwards compatibility with __experimental_actions
export default function resolveDocumentActions(props: any): DocumentActionComponent[] {
  const schemaType = schema.get(props.type)

  return [
    isActionEnabled(schemaType, 'publish') && PublishAction,
    isActionEnabled(schemaType, 'delete') && DiscardChangesAction,
    isActionEnabled(schemaType, 'delete') && UnpublishAction,
    isActionEnabled(schemaType, 'create') && DuplicateAction,
    isActionEnabled(schemaType, 'delete') && DeleteAction,
  ].filter(isDocumentAction)
}
