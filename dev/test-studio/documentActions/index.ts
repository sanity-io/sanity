import {DocumentActionsResolver} from 'sanity'
import {TestConfirmDialogAction} from './actions/TestConfirmDialogAction'
import {TestModalDialogAction} from './actions/TestModalDialogAction'
import {TestPopoverDialogAction} from './actions/TestPopoverDialogAction'
import {TestCustomComponentAction} from './actions/TestCustomComponentAction'

export const resolveDocumentActions: DocumentActionsResolver = (prev, {schemaType}) => {
  if (schemaType === 'documentActionsTest') {
    return [
      TestConfirmDialogAction,
      TestModalDialogAction,
      TestPopoverDialogAction,
      TestCustomComponentAction,
      ...prev,
    ]
  }

  return prev
}
