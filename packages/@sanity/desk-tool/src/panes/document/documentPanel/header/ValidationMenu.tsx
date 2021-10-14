import {useId} from '@reach/auto-id'
import {ValidationList} from '@sanity/base/components'
import {ErrorOutlineIcon} from '@sanity/icons'
import {Button, Menu, MenuButton} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {useDocumentPane} from '../../useDocumentPane'

interface ValidationMenuProps {
  boundaryElement: HTMLDivElement | null
  isOpen: boolean
  setOpen: (val: boolean) => void
}

export function ValidationMenu(props: ValidationMenuProps) {
  const {boundaryElement, isOpen, setOpen} = props
  const {documentSchema, handleFocus, markers} = useDocumentPane()

  const validationMarkers = useMemo(
    () => markers.filter((marker) => marker.type === 'validation'),
    [markers]
  )

  const validationErrorMarkers = useMemo(
    () => validationMarkers.filter((marker) => marker.level === 'error'),
    [validationMarkers]
  )

  const validationWarningwarnings = useMemo(
    () => validationMarkers.filter((marker) => marker.level === 'warning'),
    [validationMarkers]
  )

  const id = useId()

  const handleClose = useCallback(() => setOpen(false), [setOpen])

  if (validationErrorMarkers.length === 0 && validationWarningwarnings.length === 0) {
    return null
  }

  const popoverContent = (
    <ValidationList
      documentType={documentSchema}
      markers={validationMarkers}
      onClose={handleClose}
      onFocus={handleFocus}
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
