import classNames from 'classnames'
import React from 'react'
import {
  isValidationErrorMarker,
  isValidationMarker,
  isValidationWarningMarker,
  Marker
} from '@sanity/types'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import WarningOutlineIcon from 'part:@sanity/base/warning-outline-icon'
import {Tooltip} from 'part:@sanity/components/tooltip'
import {Placement} from '../types'
import ValidationList from './ValidationList'

import styles from './ValidationStatus.css'

interface ValidationStatusProps {
  hideTooltip?: boolean
  markers: Marker[]
  placement?: Placement
  showSummary?: boolean
}

function ValidationStatus(props: ValidationStatusProps & React.HTMLProps<HTMLDivElement>) {
  const {
    className,
    markers = [],
    placement = 'auto',
    showSummary = false,
    hideTooltip = false,
    ...restProps
  } = props
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
    <div
      {...restProps}
      className={classNames(
        styles.root,
        className,
        hasErrors && styles.error,
        !hasErrors && hasWarnings && styles.warning
      )}
      tabIndex={0}
    >
      {hasErrors && <ErrorOutlineIcon />}
      {!hasErrors && hasWarnings && <WarningOutlineIcon />}
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
    <Tooltip content={tooltipContent} placement={placement} portal>
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
        {hasErrors && <ErrorOutlineIcon />}
        {!hasErrors && hasWarnings && <WarningOutlineIcon />}
      </div>
      <div className={styles.tooltipText}>{text}</div>
    </div>
  )
}
