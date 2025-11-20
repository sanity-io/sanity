import {type DocumentActionComponent} from '../../../config/document/actions'
import {type DocumentActionsContext} from '../../../config/types'
import {useDiscardVersionAction} from './DiscardVersionAction'
import {useUnpublishVersionAction} from './UnpublishVersionAction'

type Action = DocumentActionComponent

export default function resolveDocumentActions(
  existingActions: Action[],
  context: DocumentActionsContext,
): Action[] {
  const duplicateAction = existingActions.filter(({action}) => action === 'duplicate')

  if (context.versionType === 'version') {
    // For regular version documents, show traditional version actions
    return duplicateAction.concat(useDiscardVersionAction, useUnpublishVersionAction)
  }

  return existingActions
}
