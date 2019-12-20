import React from 'react'

export interface ActionComponent<ActionProps> {
  (props: ActionProps): ActionDescription
}

interface Document {
  _id: string,
  _type: string
}

interface DocumentActionProps {
  id: string
  draft: null | Document
  published: null | Document
}

export type DocumentActionComponent = ActionComponent<DocumentActionProps>

export interface ActionDialog {
  type: 'modal' | 'confirm'
  content: React.ReactNode
}

export interface ActionDescription {
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  title?: string
  dialog?: ActionDialog
  onHandle?: () => void
}
