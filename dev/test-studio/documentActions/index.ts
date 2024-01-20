import {type DocumentActionsResolver} from 'sanity'

import {TestConfirmDialogAction} from './actions/TestConfirmDialogAction'
import {TestCustomComponentAction} from './actions/TestCustomComponentAction'
import {TestModalDialogAction} from './actions/TestModalDialogAction'
import {TestPopoverDialogAction} from './actions/TestPopoverDialogAction'

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
