// This is transitional in order to track usage of the PopoverDialog part from within the form-builder package
// At some point we should offer a PopoverDialog component, either as a part of the future sanity studio components library or @sanity/ui

import {Placement} from '@sanity/ui'
import PopoverDialogPart from 'part:@sanity/components/dialogs/popover'
import React from 'react'

type Props = {
  onClose: () => void
  referenceElement?: HTMLElement | null
  children?: React.ReactNode
  placement?: Placement
  title?: string
  depth?: number
  fallbackPlacements?: Placement[]
  preventOverflow?: boolean
  portal?: boolean
  size?: 'small' | 'medium' | 'large' | 'auto'
}

export function PopoverDialog({
  children,
  onClose,
  placement,
  referenceElement,
  depth,
  preventOverflow,
  fallbackPlacements,
  portal,
  title,
  size,
}: Props) {
  return (
    <PopoverDialogPart
      title={title}
      fallbackPlacements={fallbackPlacements}
      onClose={onClose}
      onEscape={onClose}
      onClickOutside={onClose}
      referenceElement={referenceElement}
      placement={placement}
      preventOverflow={preventOverflow}
      size={size}
      depth={depth}
      portal={portal}
    >
      {children}
    </PopoverDialogPart>
  )
}
