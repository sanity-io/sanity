import React from 'react'
export interface CreateDocumentPreviewItem {
  key: string
  title?: string
  subtitle?: string
  icon?: React.ComponentType<unknown>
  onClick?: () => void
}
interface CreateDocumentListProps {
  items: CreateDocumentPreviewItem[]
}
declare function CreateDocumentList(props: CreateDocumentListProps): JSX.Element
export default CreateDocumentList
