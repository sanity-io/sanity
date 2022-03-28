import type React from 'react'
interface EditItemFoldOutProps {
  title?: string
  children: React.ReactNode
  onClose?: () => void
  referenceElement?: HTMLElement | null
  style?: React.CSSProperties
}
export default EditItemFoldOut
declare function EditItemFoldOut(props: EditItemFoldOutProps): JSX.Element
