/* eslint-disable camelcase */

import {hues} from '@sanity/color'
import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {FormNodeValidation} from '@sanity/types'
import {Placement, Text} from '@sanity/ui'
import React, {useMemo} from 'react'
import {Tooltip} from '../../../../ui'

/** @internal */
export interface FormFieldValidationStatusProps {
  /**
   *
   * @hidden
   * @beta
   */
  validation?: FormNodeValidation[]
  /**
   *
   * @hidden
   * @beta
   */
  __unstable_showSummary?: boolean
  fontSize?: number | number
  placement?: Placement
}

const EMPTY_ARRAY: never[] = []

const VALIDATION_COLORS: Record<'error' | 'warning' | 'info', string> = {
  error: hues.red[500].hex,
  warning: hues.yellow[500].hex,
  info: hues.blue[500].hex,
}

const VALIDATION_ICONS: Record<'error' | 'warning' | 'info', React.ReactElement> = {
  error: (
    <ErrorOutlineIcon
      data-testid="input-validation-icon-error"
      aria-label="Has error"
      aria-hidden
      role="presentation"
    />
  ),
  warning: (
    <WarningOutlineIcon
      data-testid="input-validation-icon-warning"
      aria-label="Has warning"
      aria-hidden
      role="presentation"
    />
  ),
  info: (
    <InfoOutlineIcon
      data-testid="input-validation-icon-info"
      aria-label="Has information"
      aria-hidden
      role="presentation"
    />
  ),
}

/** @internal */
export function FormFieldValidationStatus(props: FormFieldValidationStatusProps) {
  const {
    validation = EMPTY_ARRAY,
    __unstable_showSummary: showSummary,
    fontSize,
    placement = 'top',
  } = props

  const errors = validation.filter((v) => v.level === 'error')
  const warnings = validation.filter((v) => v.level === 'warning')
  const info = validation.filter((v) => v.level === 'info')

  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0
  const hasInfo = info.length > 0

  const statusIcon = useMemo(() => {
    if (hasErrors) return VALIDATION_ICONS.error
    if (hasWarnings) return VALIDATION_ICONS.warning
    if (hasInfo) return VALIDATION_ICONS.info
    return undefined
  }, [hasErrors, hasInfo, hasWarnings])

  const statusColor = useMemo(() => {
    if (hasErrors) return VALIDATION_COLORS.error
    if (hasWarnings) return VALIDATION_COLORS.warning
    if (hasInfo) return VALIDATION_COLORS.info
    return undefined
  }, [hasErrors, hasInfo, hasWarnings])

  const validationMessage: string = useMemo(() => {
    return validation.map((item) => item.message).join('\n')
  }, [validation])

  return (
    <Tooltip
      text={showSummary ? FormFieldValidationSummary({validation}) : validationMessage}
      placement={placement}
      portal
      fallbackPlacements={['bottom', 'right', 'left']}
    >
      <div>
        <Text muted size={fontSize} weight="semibold" style={{color: statusColor}}>
          {statusIcon}
        </Text>
      </div>
    </Tooltip>
  )
}

function FormFieldValidationSummary({validation}: {validation: FormNodeValidation[]}) {
  const errorMarkers = validation.filter((item) => item.level === 'error')
  const warningMarkers = validation.filter((item) => item.level === 'warning')
  const errorLen = errorMarkers.length
  const warningLen = warningMarkers.length

  const errorsStr = `error${errorLen === 1 ? '' : 's'}`
  const warningsStr = `warning${warningLen === 1 ? '' : 's'}`
  const errorText = errorLen && `${errorLen} ${errorsStr}`
  const warningText = warningLen && `${warningLen} ${warningsStr}`

  const hasErrors = errorLen > 0
  const hasWarnings = warningLen > 0
  const hasBoth = hasErrors && hasWarnings

  return `${errorText ? errorText : ''}${hasBoth ? ' and ' : ''}${warningText ? warningText : ''}`
}
