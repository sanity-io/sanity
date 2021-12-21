import {DocumentActionComponent} from '@sanity/base'
import {EditStateFor} from '@sanity/base/_internal'
import {Schema} from '@sanity/types'
import {PublishAction} from '../actions/PublishAction'
import {DiscardChangesAction} from '../actions/DiscardChangesAction'
import {UnpublishAction} from '../actions/UnpublishAction'
import {DuplicateAction} from '../actions/DuplicateAction'
import {DeleteAction} from '../actions/DeleteAction'
import {isActionEnabled} from '../TODO'

// NOTE: this is a small utility function to avoid having to _cast_ the
// filtered array below to `DocumentActionComponent[]`.
function isDocumentAction(
  value: DocumentActionComponent | false
): value is DocumentActionComponent {
  return value !== false
}

// todo: this should be replaced with the defaultResolveDocumentActions function from ./defaultDocumentActions eventually,
// it is kept here for now to preserve backwards compatibility with __experimental_actions
export default function resolveDocumentActions(
  schema: Schema,
  props: EditStateFor
): DocumentActionComponent[] {
  // const {} = useConfig()
  const schemaType = schema.get(props.type)

  return [
    isActionEnabled(schemaType, 'publish') && PublishAction,
    isActionEnabled(schemaType, 'delete') && DiscardChangesAction,
    isActionEnabled(schemaType, 'delete') && UnpublishAction,
    isActionEnabled(schemaType, 'create') && DuplicateAction,
    isActionEnabled(schemaType, 'delete') && DeleteAction,
  ].filter(isDocumentAction)
}
