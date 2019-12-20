import React from 'react'

export interface ActionComponent<ActionProps> {
  (props: ActionProps): ActionDescription
}

interface Document {
  _id: string
  _type: string
}

interface DocumentActionProps {
  id: string
  type: string
  draft: null | Document
  published: null | Document
}

export type DocumentActionComponent = ActionComponent<DocumentActionProps>

interface ConfirmDialogProps {
  type: 'confirm'
  color: string
  message: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
}

// Todo: move these to action spec/core types
interface ModalDialogProps {
  type: 'modal'
  content: React.ReactNode
  onClose: () => void
}

// Todo: move these to action spec/core types
interface PopOverDialogProps {
  type: 'popover'
  content: React.ReactNode
  onClose: () => void
}

export interface ActionDescription {
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  title?: string
  dialog?: ConfirmDialogProps | PopOverDialogProps | ModalDialogProps
  onHandle?: () => void
}
