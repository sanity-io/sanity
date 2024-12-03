import {type DocumentActionComponent, type DocumentActionsContext} from 'sanity'

import {DiscardVersionAction} from './DiscardVersionAction'

type Action = DocumentActionComponent

export default function resolveDocumentActions(
  existingActions: Action[],
  context: DocumentActionsContext,
): Action[] {
  const duplicateAction = existingActions.filter(({name}) => name === 'DuplicateAction')
  return context.versionType === 'version'
    ? duplicateAction.concat(DiscardVersionAction)
    : existingActions
}
