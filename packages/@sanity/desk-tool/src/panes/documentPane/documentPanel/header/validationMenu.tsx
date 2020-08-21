import Button from 'part:@sanity/components/buttons/default'
import ValidationList from 'part:@sanity/components/validation/list'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import React from 'react'
import {Tooltip} from 'react-tippy'

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
    <Tooltip
      arrow
      distance={13}
      html={
        <ValidationList
          documentType={schemaType}
          markers={validationMarkers}
          isOpen={isOpen}
          onClose={onClose}
          onFocus={setFocusPath}
          showLink
        />
      }
      inertia={false}
      interactive
      onRequestClose={onClose}
      open={isOpen}
      position="bottom"
      theme="light"
      trigger="click"
    >
      <Button
        color={validationErrorMarkers.length > 0 ? 'danger' : 'warning'}
        kind="simple"
        icon={ErrorOutlineIcon}
        onClick={onToggle}
        padding="small"
        selected={isOpen}
        title="Show validation issues"
      />
    </Tooltip>
  )
}
