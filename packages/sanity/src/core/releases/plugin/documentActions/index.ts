import {type DocumentActionComponent, type DocumentActionsContext} from 'sanity'

import {DiscardVersionAction} from './DiscardVersionAction'

type Action = DocumentActionComponent

export default function resolveDocumentActions(
  existingActions: Action[],
  context: DocumentActionsContext,
): Action[] {
  if (context.perspective === 'version') {
    const duplicateAction = existingActions.find((action) => {
      return action.name === 'DuplicateAction'
    })
    return [...(duplicateAction ? [duplicateAction] : []), DiscardVersionAction]
  }

  return existingActions
}
