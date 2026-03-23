import {copyAction} from '../../../form/field/actions/copyAction'
import {pasteAction} from '../../../form/field/actions/pasteAction'
import {type DocumentFieldAction} from './types'

export {defineDocumentFieldAction} from './define'
export {documentFieldActionsReducer} from './reducer'
export type {
  DocumentFieldAction,
  DocumentFieldActionDivider,
  DocumentFieldActionGroup,
  DocumentFieldActionHook,
  DocumentFieldActionItem,
  DocumentFieldActionNode,
  DocumentFieldActionProps,
  DocumentFieldActionsResolver,
  DocumentFieldActionsResolverContext,
  DocumentFieldActionStatus,
  DocumentFieldActionTone,
} from './types'

/** @internal */
export const initialDocumentFieldActions: DocumentFieldAction[] = [copyAction, pasteAction]
