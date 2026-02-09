import {copyAction} from '../../../form/field/actions/copyAction'
import {linkToFieldAction} from '../../../form/field/actions/linkToFieldAction'
import {pasteAction} from '../../../form/field/actions/pasteAction'
import {type DocumentFieldAction} from './types'

export * from './define'
export * from './reducer'
export * from './types'

/** @internal */
export const initialDocumentFieldActions: DocumentFieldAction[] = [
  copyAction,
  linkToFieldAction,
  pasteAction,
]
