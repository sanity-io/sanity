// This is transitional in order to track usage of the ActivateOnFocusPart part from within the form-builder package
import React from 'react'
import ActivateOnFocusPart from 'part:@sanity/components/utilities/activate-on-focus'

interface Props {
  children: React.ReactNode
  html?: React.ReactNode
  isActive?: boolean
  onActivate?: () => void
  overlayClassName?: string
  inputId?: string
}

export function ActivateOnFocus(props: Props) {
  return <ActivateOnFocusPart {...props} />
}
