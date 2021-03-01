import {MenuButton} from 'part:@sanity/components/menu-button'
import ValidationList from 'part:@sanity/components/validation/list'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import React, {useCallback} from 'react'

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
      // showLink
    />
  )

  return (
    <MenuButton
      boundaryElement={boundaryElement}
      buttonProps={{
        color: validationErrorMarkers.length > 0 ? 'danger' : 'warning',
        kind: 'simple',
        icon: ErrorOutlineIcon,
        padding: 'small',
        selected: isOpen,
        title: 'Show validation issues',
      }}
      menu={popoverContent}
      open={isOpen}
      placement="bottom"
      setOpen={setOpen}
    />
  )
}
