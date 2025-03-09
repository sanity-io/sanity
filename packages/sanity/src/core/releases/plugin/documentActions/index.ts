import {type DocumentActionComponent} from '../../../config/document/actions'
import {type DocumentActionsContext} from '../../../config/types'
import {DiscardVersionAction} from './DiscardVersionAction'
import {UnpublishVersionAction} from './UnpublishVersionAction'

type Action = DocumentActionComponent

export default function resolveDocumentActions(
  existingActions: Action[],
  context: DocumentActionsContext,
): Action[] {
  const duplicateAction = existingActions.filter(({name}) => name === 'DuplicateAction')

  if (context.versionType === 'version') {
    return duplicateAction.concat(DiscardVersionAction, UnpublishVersionAction)
  }

  return existingActions
}
