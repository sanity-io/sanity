// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {ValidationList} from '@sanity/base/components'
import {ErrorOutlineIcon} from '@sanity/icons'
import React, {useCallback} from 'react'
import {Button, Menu, MenuButton} from '@sanity/ui'
import {useId} from '@reach/auto-id'

interface ValidationMenuProps {
  boundaryElement: HTMLDivElement | null
  isOpen: boolean
  // @todo: replace with type from @sanity/types
  markers: any[]
  schemaType: any
  setFocusPath: (path: any) => void
  setOpen: (val: boolean) => void
}

export function ValidationMenu(props: ValidationMenuProps) {
  const {boundaryElement, isOpen, markers, schemaType, setFocusPath, setOpen} = props
  const validationMarkers = markers.filter((marker) => marker.type === 'validation')
  const validationErrorMarkers = validationMarkers.filter((marker) => marker.level === 'error')
  const validationWarningwarnings = validationMarkers.filter((marker) => marker.level === 'warning')
  const id = useId()

  const handleClose = useCallback(() => setOpen(false), [setOpen])

  if (validationErrorMarkers.length === 0 && validationWarningwarnings.length === 0) {
    return null
  }

  const popoverContent = (
    <ValidationList
      documentType={schemaType}
      markers={validationMarkers}
      onClose={handleClose}
      onFocus={setFocusPath}
    />
  )

  return (
    <MenuButton
      id={id || ''}
      button={
        <Button
          icon={ErrorOutlineIcon}
          title="Show validation issues"
          mode="bleed"
          tone="critical"
        />
      }
      menu={<Menu open={isOpen}>{popoverContent}</Menu>}
      popover={{
        portal: true,
        boundaryElement: boundaryElement,
        constrainSize: true,
        preventOverflow: true,
        width: 0,
      }}
      placement="bottom-end"
    />
  )
}
