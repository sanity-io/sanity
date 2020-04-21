/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react'
import {Tooltip} from 'react-tippy'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'
import ValidationList from 'part:@sanity/components/validation/list'
import ChevronDown from 'part:@sanity/base/chevron-down-icon'
import WarningIcon from 'part:@sanity/base/warning-icon'

interface ValidationProps {
  id: string
  type: string
  onCloseValidationResults: () => void
  onFocus: (path: any) => void
  onToggleValidationResults: () => void
  markers: any[]
  showValidationTooltip: boolean
}

export function Validation(props: ValidationProps) {
  const {
    onCloseValidationResults,
    onFocus,
    onToggleValidationResults,
    showValidationTooltip,
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
    <Tooltip
      arrow
      theme="light"
      trigger="click"
      position="bottom"
      interactive
      duration={100}
      open={showValidationTooltip}
      onRequestClose={onCloseValidationResults}
      html={
        <ValidationList
          truncate
          markers={validation}
          showLink
          isOpen={showValidationTooltip}
          documentType={schema.get(type)}
          onClose={onCloseValidationResults}
          onFocus={onFocus}
        />
      }
    >
      <Button
        color={errors.length > 0 ? 'danger' : 'warning'}
        bleed
        icon={WarningIcon}
        padding="small"
        onClick={onToggleValidationResults}
      >
        {errors.length + warnings.length}
        <span style={{paddingLeft: '0.5em', display: 'flex'}}>
          <ChevronDown />
        </span>
      </Button>
    </Tooltip>
  )
}
