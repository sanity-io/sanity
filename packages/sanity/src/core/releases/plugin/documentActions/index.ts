import {type DocumentActionComponent, type DocumentActionsContext} from 'sanity'

import {DiscardVersionAction} from './DiscardVersionAction'
import {UnpublishVersionAction} from './UnpublishVersionAction'

type Action = DocumentActionComponent

export default function resolveDocumentActions(
  existingActions: Action[],
  context: DocumentActionsContext,
): Action[] {
  const duplicateAction = existingActions.filter(({name}) => name === 'DuplicateAction')
  return context.perspective === 'version'
    ? duplicateAction.concat(DiscardVersionAction).concat(UnpublishVersionAction)
    : existingActions
}
