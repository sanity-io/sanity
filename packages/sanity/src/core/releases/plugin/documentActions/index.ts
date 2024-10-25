import {type DocumentActionComponent, type DocumentActionsContext} from 'sanity'

import {DiscardVersionAction} from './DiscardVersionAction'

type Action = DocumentActionComponent

export default function resolveDocumentActions(
  existingActions: Action[],
  context: DocumentActionsContext,
): Action[] {
  if (context.perspective === 'version') {
    return [
      ...existingActions.filter((action) => {
        return action && action.action === 'publish'
      }),
      DiscardVersionAction,
    ]
  }

  return existingActions
}
