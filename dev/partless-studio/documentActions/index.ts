import {DocumentActionsResolver} from '@sanity/base'
import {TestConfirmDialogAction} from './actions/TestConfirmDialogAction'
import {TestModalDialogAction} from './actions/TestModalDialogAction'
import {TestPopoverDialogAction} from './actions/TestPopoverDialogAction'

export const resolveDocumentActions: DocumentActionsResolver = (prev, {schemaType}) => {
  if (schemaType === 'documentActionsTest') {
    return [TestConfirmDialogAction, TestModalDialogAction, TestPopoverDialogAction, ...prev]
  }

  return prev
}
