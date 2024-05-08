import {type DocumentActionsResolver} from 'sanity'

import {TestConfirmDialogAction} from './actions/TestConfirmDialogAction'
import {TestCustomComponentAction} from './actions/TestCustomComponentAction'
import {TestCustomRestoreAction} from './actions/TestCustomRestoreAction'
import {TestModalDialogAction} from './actions/TestModalDialogAction'
import {TestPopoverDialogAction} from './actions/TestPopoverDialogAction'
import {CopyDocumentAction} from './actions/CopyDocumentAction'
import {PasteDocumentAction} from './actions/PasteDocumentAction'

export const resolveDocumentActions: DocumentActionsResolver = (prev, {schemaType}) => {
  if (schemaType === 'documentActionsTest') {
    return [
      TestConfirmDialogAction,
      TestModalDialogAction,
      TestPopoverDialogAction,
      TestCustomComponentAction,
      CopyDocumentAction,
      PasteDocumentAction,
      ...prev,
    ].map((action) => {
      if (action.action === 'restore') {
        return TestCustomRestoreAction(action)
      }

      return action
    })
  }

  if (schemaType === 'removeRestoreActionTest') {
    return prev.filter(({action}) => action !== 'restore')
  }

  return [...prev, PasteDocumentAction, CopyDocumentAction]
}
