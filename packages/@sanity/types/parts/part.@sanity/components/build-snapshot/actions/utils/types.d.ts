import type React from 'react'
export interface ActionComponent<ActionProps> {
  (props: ActionProps): ActionDescription
}
interface Document {
  _id: string
  _type: string
}
export interface DocumentActionProps {
  id: string
  type: string
  draft: null | Document
  published: null | Document
  onComplete: () => void
}
export declare type DocumentActionComponent = ActionComponent<DocumentActionProps>
interface ConfirmDialogProps {
  type: 'confirm'
  color?: 'warning' | 'success' | 'danger' | 'info'
  message: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
}
interface ModalDialogProps {
  type: 'modal'
  content: React.ReactNode
  onClose: () => void
}
interface PopOverDialogProps {
  type: 'popover'
  content: React.ReactNode
  onClose: () => void
}
export interface ActionDescription {
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  shortcut?: string
  title?: string
  dialog?: ConfirmDialogProps | PopOverDialogProps | ModalDialogProps
  onHandle?: () => void
}
export {}
