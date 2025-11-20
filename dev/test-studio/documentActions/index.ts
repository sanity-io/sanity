import {type DocumentActionsResolver} from 'sanity'

import {createCustomDuplicateAction} from './actions/createCustomDuplicateAction'
import {
  createCustomPublishAction,
  createNoopPatchPublishAction,
} from './actions/createCustomPublishAction'
import {useDebugAction} from './actions/DebugAction'
import {useTestConfirmDialogAction} from './actions/TestConfirmDialogAction'
import {useTestCustomComponentAction} from './actions/TestCustomComponentAction'
import {createTestCustomRestoreAction} from './actions/TestCustomRestoreAction'
import {useTestModalDialogAction} from './actions/TestModalDialogAction'
import {useTestPopoverDialogAction} from './actions/TestPopoverDialogAction'

export const resolveDocumentActions: DocumentActionsResolver = (prev, {schemaType}) => {
  if (schemaType === 'documentActionsTest') {
    return [
      useDebugAction,
      useTestConfirmDialogAction,
      useTestModalDialogAction,
      useTestPopoverDialogAction,
      useTestCustomComponentAction,
      ...prev,
    ].flatMap((action) => {
      if (action.action === 'restore') {
        return createTestCustomRestoreAction(action)
      }
      if (action.action === 'publish') {
        return [createCustomPublishAction(action), createNoopPatchPublishAction(action)]
      }
      if (action.action === 'duplicate') {
        return createCustomDuplicateAction(action)
      }
      return action
    })
  }

  if (schemaType === 'removeRestoreActionTest') {
    return prev.filter(({action}) => action !== 'restore')
  }

  return prev
}
