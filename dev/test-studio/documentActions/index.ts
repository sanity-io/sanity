import {type DocumentActionsResolver} from 'sanity'

import {createCustomDuplicateAction} from './actions/createCustomDuplicateAction'
import {
  createCustomPublishAction,
  createNoopPatchPublishAction,
} from './actions/createCustomPublishAction'
import {useDebugAction} from './actions/DebugAction'
import {TestConfirmDialogAction} from './actions/TestConfirmDialogAction'
import {TestCustomComponentAction} from './actions/TestCustomComponentAction'
import {TestCustomRestoreAction} from './actions/TestCustomRestoreAction'
import {TestModalDialogAction} from './actions/TestModalDialogAction'
import {TestPopoverDialogAction} from './actions/TestPopoverDialogAction'

export const resolveDocumentActions: DocumentActionsResolver = (prev, {schemaType}) => {
  if (schemaType === 'documentActionsTest') {
    return [
      useDebugAction,
      TestConfirmDialogAction,
      TestModalDialogAction,
      TestPopoverDialogAction,
      TestCustomComponentAction,
      ...prev,
    ].flatMap((action) => {
      if (action.action === 'restore') {
        return TestCustomRestoreAction(action)
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
