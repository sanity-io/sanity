import React from 'react'
import {ActivateOnFocusPart} from '../legacyParts'

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
