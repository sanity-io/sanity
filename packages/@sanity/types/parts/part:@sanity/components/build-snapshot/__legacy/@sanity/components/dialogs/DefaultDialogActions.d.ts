/// <reference types="react" />
import {DialogAction} from './types'
export declare function DefaultDialogActions(props: {
  actions: DialogAction[]
  actionsAlign?: 'start' | 'end'
  onAction?: (action: DialogAction) => void
}): JSX.Element
