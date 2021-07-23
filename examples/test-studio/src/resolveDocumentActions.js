import defaultResolve from 'part:@sanity/base/document-actions'
import {TestConfirmDialogAction} from './actions/TestConfirmDialogAction'
import {TestErrorDialogAction} from './actions/TestErrorDialogAction'
import {TestLegacyDialogAction} from './actions/TestLegacyDialogAction'
import {TestModalDialogAction} from './actions/TestModalDialogAction'
import {TestPopoverDialogAction} from './actions/TestPopoverDialogAction'
import {TestSuccessDialogAction} from './actions/TestSuccessDialogAction'

function OnlyWhenPublishedAction() {
  return {
    label: `Document is published`,
  }
}

export default function resolveDocumentActions(props) {
  if (props.type === 'documentActionsTest') {
    return [
      // ...defaultResolve(props),
      TestConfirmDialogAction,
      TestErrorDialogAction,
      TestLegacyDialogAction,
      TestModalDialogAction,
      TestPopoverDialogAction,
      TestSuccessDialogAction,
    ]
  }

  return [...defaultResolve(props), props.published ? OnlyWhenPublishedAction : null].filter(
    Boolean
  )
}
