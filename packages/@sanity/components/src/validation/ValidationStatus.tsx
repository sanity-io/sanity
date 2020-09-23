import React from 'react'
import {
  isValidationErrorMarker,
  isValidationMarker,
  isValidationWarningMarker,
  Marker
} from '@sanity/types'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import Button from 'part:@sanity/components/buttons/default'
import {Tooltip} from 'part:@sanity/components/tooltip'
import ValidationList from './ValidationList'

import styles from './ValidationStatus.css'

interface ValidationStatusProps {
  hideTooltip?: boolean
  showSummary?: boolean
  markers: Marker[]
}

function ValidationStatus(props: ValidationStatusProps) {
  const {markers = [], showSummary = false, hideTooltip = false} = props
  const validationMarkers = markers.filter(isValidationMarker)

  if (validationMarkers.length === 0) {
    return null
  }

  const errorMarkers = validationMarkers.filter(isValidationErrorMarker)
  const warningMarkers = validationMarkers.filter(isValidationWarningMarker)

  const errorsStr = `error${errorMarkers.length === 1 ? '' : 's'}`
  const warningsStr = `warning${warningMarkers.length === 1 ? '' : 's'}`
  const errorText = errorMarkers.length > 0 ? `${errorMarkers.length} validation ${errorsStr}` : ''
  const warningText = warningMarkers.length > 0 ? `${warningMarkers.length} ${warningsStr}` : ''

  const hasErrors = errorMarkers.length > 0
  const hasWarnings = warningMarkers.length > 0
  const hasBoth = hasErrors && hasWarnings

  const children = (
    <div className={styles.root}>
      <Button color="danger" icon={ErrorOutlineIcon} kind="simple" padding="none" />
    </div>
  )

  if (hideTooltip) {
    return children
  }

  const tooltipText = `${errorText} ${
    warningText === '' ? '' : `${hasBoth ? 'and ' : ''}${warningText}`
  }`

  const tooltipContent = (
    <>
      {showSummary && (
        <ValidationSummaryTooltipContent
          hasErrors={hasErrors}
          hasWarnings={hasWarnings}
          text={tooltipText}
        />
      )}

      {!showSummary && <ValidationList markers={validationMarkers} kind="simple" />}
    </>
  )

  return (
    <Tooltip content={tooltipContent} placement="auto" portal>
      {children}
    </Tooltip>
  )
}

export default ValidationStatus

function ValidationSummaryTooltipContent({
  hasErrors,
  hasWarnings,
  text
}: {
  hasErrors: boolean
  hasWarnings: boolean
  text: string
}) {
  return (
    <div className={styles.tooltip}>
      <div
        className={!hasErrors && hasWarnings ? styles.tooltipWarningIcon : styles.tooltipErrorIcon}
      >
        <ErrorOutlineIcon />
      </div>
      <div className={styles.tooltipText}>{text}</div>
    </div>
  )
}
