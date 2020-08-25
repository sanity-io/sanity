import React from 'react'
import {Popover} from 'part:@sanity/components/popover'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'
import ValidationList from 'part:@sanity/components/validation/list'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'

interface ValidationProps {
  type: string
  onCloseValidationResults: () => void
  onFocus: (path: any) => void
  onToggleValidationResults: () => void
  markers: any[]
  showValidationPopover: boolean
}

export function Validation(props: ValidationProps) {
  const {
    onCloseValidationResults,
    onToggleValidationResults,
    onFocus,
    showValidationPopover,
    type,
    markers
  } = props
  const validation = markers.filter(marker => marker.type === 'validation')
  const errors = validation.filter(marker => marker.level === 'error')
  const warnings = validation.filter(marker => marker.level === 'warning')

  if (errors.length === 0 && warnings.length === 0) {
    return null
  }

  return (
    <Popover
      placement="bottom-end"
      open={showValidationPopover}
      content={
        <ValidationList
          markers={validation}
          showLink
          isOpen={showValidationPopover}
          documentType={schema.get(type)}
          onClose={onCloseValidationResults}
          onFocus={onFocus}
        />
      }
    >
      <div>
        <Button
          title="Show validation issues"
          kind="simple"
          color={errors.length > 0 ? 'danger' : 'warning'}
          icon={ErrorOutlineIcon}
          onClick={onToggleValidationResults}
          padding="small"
          selected={showValidationPopover}
        />
      </div>
    </Popover>
  )
}
