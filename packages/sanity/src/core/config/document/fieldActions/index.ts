import {copyAction} from '../../../form/field/actions/copyAction'
import {pasteAction} from '../../../form/field/actions/pasteAction'
import {type DocumentFieldAction} from './types'

export {defineDocumentFieldAction} from './define'
export {documentFieldActionsReducer} from './reducer'
export {
  type DocumentFieldAction,
  type DocumentFieldActionDivider,
  type DocumentFieldActionGroup,
  type DocumentFieldActionHook,
  type DocumentFieldActionItem,
  type DocumentFieldActionNode,
  type DocumentFieldActionProps,
  type DocumentFieldActionsResolver,
  type DocumentFieldActionsResolverContext,
  type DocumentFieldActionStatus,
  type DocumentFieldActionTone,
} from './types'

/** @internal */
export const initialDocumentFieldActions: DocumentFieldAction[] = [copyAction, pasteAction]
