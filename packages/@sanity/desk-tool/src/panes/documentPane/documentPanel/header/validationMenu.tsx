import Button from 'part:@sanity/components/buttons/default'
import ValidationList from 'part:@sanity/components/validation/list'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import React from 'react'
import {Popover} from 'part:@sanity/components/popover'

interface ValidationMenuProps {
  isOpen: boolean
  markers: any[]
  onClose: () => void
  onToggle: () => void
  schemaType: any
  setFocusPath: (path: any) => void
}

export function ValidationMenu(props: ValidationMenuProps) {
  const {isOpen, markers, onClose, onToggle, schemaType, setFocusPath} = props
  const validationMarkers = markers.filter(marker => marker.type === 'validation')
  const validationErrorMarkers = validationMarkers.filter(marker => marker.level === 'error')
  const validationWarningwarnings = validationMarkers.filter(marker => marker.level === 'warning')

  if (validationErrorMarkers.length === 0 && validationWarningwarnings.length === 0) {
    return null
  }

  return (
    <Popover
      content={
        <ValidationList
          documentType={schemaType}
          markers={validationMarkers}
          isOpen={isOpen}
          onClose={onClose}
          onFocus={setFocusPath}
          showLink
        />
      }
      open={isOpen}
      placement="bottom-end"
    >
      <div>
        <Button
          color={validationErrorMarkers.length > 0 ? 'danger' : 'warning'}
          kind="simple"
          icon={ErrorOutlineIcon}
          onClick={onToggle}
          padding="small"
          selected={isOpen}
          title="Show validation issues"
        />
      </div>
    </Popover>
  )
}
