import {type DocumentActionComponent} from '../../../config/document/actions'
import {type DocumentActionsContext} from '../../../config/types'
import {useDiscardVersionAction} from './DiscardVersionAction'
import {useUnpublishVersionAction} from './UnpublishVersionAction'

type Action = DocumentActionComponent

export default function resolveDocumentActions(
  existingActions: Action[],
  context: DocumentActionsContext,
): Action[] {
  if (context.versionType === 'version' && context.releaseId) {
    const defaultActions = existingActions.filter(({action}) => {
      return action === 'duplicate' || action === 'publish'
    })
    // For regular version documents, show traditional version actions
    return defaultActions.concat(useDiscardVersionAction, useUnpublishVersionAction)
  }

  return existingActions
}
