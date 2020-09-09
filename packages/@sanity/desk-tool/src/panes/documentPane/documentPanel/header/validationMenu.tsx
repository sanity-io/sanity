import {MenuButton} from 'part:@sanity/components/menu-button'
import ValidationList from 'part:@sanity/components/validation/list'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import React, {useCallback} from 'react'

interface ValidationMenuProps {
  isOpen: boolean
  markers: any[]
  schemaType: any
  setFocusPath: (path: any) => void
  setOpen: (val: boolean) => void
}

export function ValidationMenu(props: ValidationMenuProps) {
  const {isOpen, markers, schemaType, setFocusPath, setOpen} = props
  const validationMarkers = markers.filter(marker => marker.type === 'validation')
  const validationErrorMarkers = validationMarkers.filter(marker => marker.level === 'error')
  const validationWarningwarnings = validationMarkers.filter(marker => marker.level === 'warning')

  if (validationErrorMarkers.length === 0 && validationWarningwarnings.length === 0) {
    return null
  }

  const handleClose = useCallback(() => setOpen(false), [])

  const popoverContent = (
    <ValidationList
      documentType={schemaType}
      markers={validationMarkers}
      onClose={handleClose}
      onFocus={setFocusPath}
      showLink
    />
  )

  return (
    <MenuButton
      buttonProps={{
        color: validationErrorMarkers.length > 0 ? 'danger' : 'warning',
        kind: 'simple',
        icon: ErrorOutlineIcon,
        padding: 'small',
        selected: isOpen,
        title: 'Show validation issues'
      }}
      menu={popoverContent}
      open={isOpen}
      placement="bottom-end"
      setOpen={setOpen}
    />
  )
}
