// This is transitional in order to track usage of the EditItemFold part from within the form-builder package
import React from 'react'
import EditItemFoldPart from 'part:@sanity/components/edititem/fold'

interface Props {
  title?: string
  children: React.ReactNode
  onClose?: () => void
  referenceElement?: HTMLElement | null
  style?: React.CSSProperties
}

export function EditItemFold(props: Props) {
  return <EditItemFoldPart {...props} />
}
