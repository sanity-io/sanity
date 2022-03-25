import {DocumentActionComponent, DocumentActionResolver} from '@sanity/base'
import {isNonNullable} from '@sanity/base/util'
import {resolveDocumentActions as defaultResolve} from '@sanity/desk-tool'
import {TestConfirmDialogAction} from './actions/TestConfirmDialogAction'
import {TestModalDialogAction} from './actions/TestModalDialogAction'
import {TestPopoverDialogAction} from './actions/TestPopoverDialogAction'

const OnlyWhenPublishedAction: DocumentActionComponent = () => {
  return {
    label: `Document is published`,
  }
}

export const resolveDocumentActions: DocumentActionResolver = (props) => {
  if (props.type === 'documentActionsTest') {
    return [
      TestConfirmDialogAction,
      TestModalDialogAction,
      TestPopoverDialogAction,
      ...defaultResolve(),
    ]
  }

  return [...defaultResolve(), props.published ? OnlyWhenPublishedAction : null].filter(
    isNonNullable
  )
}
