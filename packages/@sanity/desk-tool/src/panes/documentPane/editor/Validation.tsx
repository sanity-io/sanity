import React from 'react'
import {Tooltip} from 'react-tippy'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'
import ValidationList from 'part:@sanity/components/validation/list'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import styles from './Validation.css'

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
    onToggleValidationResults,
    onFocus,
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
      trigger="click"
      theme="light"
      position="bottom"
      interactive
      open={showValidationTooltip}
      onRequestClose={onCloseValidationResults}
      distance={6}
      html={
        <ValidationList
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
        title="Show validation issues"
        kind="simple"
        inverted
        ripple={false}
        color={errors.length > 0 ? 'danger' : 'warning'}
        icon={ErrorOutlineIcon}
        className={`${styles.button} ${showValidationTooltip ? styles.isOpen : ''}`}
        onClick={onToggleValidationResults}
      />
    </Tooltip>
  )
}
