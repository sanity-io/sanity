/* eslint-disable camelcase */

import {hues} from '@sanity/color'
import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {
  isValidationErrorMarker,
  isValidationMarker,
  isValidationWarningMarker,
  Marker,
  ValidationMarker,
} from '@sanity/types'
import {Box, Flex, Placement, Stack, Text, Tooltip} from '@sanity/ui'
import React from 'react'
import {markersToValidationList} from './helpers'
import {FormFieldValidation} from './types'

export interface FormFieldValidationStatusProps {
  /**
   * @beta
   */
  __unstable_markers?: Marker[]
  /**
   * @beta
   */
  __unstable_showSummary?: boolean
  fontSize?: number | number
  placement?: Placement
  portal?: boolean
}

const VALIDATION_COLORS: Record<'error' | 'warning' | 'info', string> = {
  error: hues.red[500].hex,
  warning: hues.yellow[500].hex,
  info: hues.blue[500].hex,
}

const VALIDATION_ICONS: Record<'error' | 'warning' | 'info', React.ReactElement> = {
  error: <ErrorOutlineIcon />,
  warning: <WarningOutlineIcon />,
  info: <InfoOutlineIcon />,
}

export function FormFieldValidationStatus(props: FormFieldValidationStatusProps) {
  const {
    __unstable_markers: markers = [],
    __unstable_showSummary: showSummary,
    fontSize,
    placement = 'top',
    portal,
  } = props
  const validationMarkers = markers.filter(isValidationMarker)
  const validation = markersToValidationList(validationMarkers)
  const errors = validation.filter((v) => v.type === 'error')
  const warnings = validation.filter((v) => v.type === 'warning')
  const info = validation.filter((v) => v.type === 'info')

  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0
  const hasInfo = info.length > 0

  const statusIcon = () => {
    if (hasErrors) return VALIDATION_ICONS.error
    if (hasWarnings) return VALIDATION_ICONS.warning
    if (hasInfo) return VALIDATION_ICONS.info
    return null
  }

  const statusColor = () => {
    if (hasErrors) return VALIDATION_COLORS.error
    if (hasWarnings) return VALIDATION_COLORS.warning
    if (hasInfo) return VALIDATION_COLORS.info
    return null
  }

  return (
    <Tooltip
      content={
        <Stack padding={3} space={3}>
          {showSummary && <FormFieldValidationSummary markers={validationMarkers} />}

          {!showSummary && (
            <>
              {validation.map((item, itemIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <FormFieldValidationStatusItem item={item} key={itemIndex} />
              ))}
            </>
          )}
        </Stack>
      }
      portal={portal}
      placement={placement}
      fallbackPlacements={['bottom', 'right', 'left']}
    >
      <div>
        <Text muted size={fontSize} weight="semibold" style={{color: statusColor()}}>
          {statusIcon()}
        </Text>
      </div>
    </Tooltip>
  )
}

function FormFieldValidationStatusItem(props: {item: FormFieldValidation}) {
  const {item} = props

  const statusIcon = () => {
    if (item.type === 'error') return VALIDATION_ICONS.error
    if (item.type === 'warning') return VALIDATION_ICONS.warning
    if (item.type === 'info') return VALIDATION_ICONS.info
    return null
  }

  const statusColor = () => {
    if (item.type === 'error') return VALIDATION_COLORS.error
    if (item.type === 'warning') return VALIDATION_COLORS.warning
    if (item.type === 'info') return VALIDATION_COLORS.info
    return null
  }

  return (
    <Flex>
      <Box marginRight={2}>
        <Text size={1} style={{color: statusColor()}}>
          {statusIcon()}
        </Text>
      </Box>
      <Box flex={1}>
        <Text muted size={1}>
          {item.label}
        </Text>
      </Box>
    </Flex>
  )
}

function FormFieldValidationSummary({markers}: {markers: ValidationMarker[]}) {
  const errorMarkers = markers.filter(isValidationErrorMarker)
  const warningMarkers = markers.filter(isValidationWarningMarker)
  const errorLen = errorMarkers.length
  const warningLen = warningMarkers.length

  const errorsStr = `error${errorLen === 1 ? '' : 's'}`
  const warningsStr = `warning${warningLen === 1 ? '' : 's'}`
  const errorText = errorLen && `${errorLen} ${errorsStr}`
  const warningText = warningLen && `${warningLen} ${warningsStr}`

  const hasErrors = errorLen > 0
  const hasWarnings = warningLen > 0
  const hasBoth = hasErrors && hasWarnings

  return (
    <Text muted size={1}>
      {errorText || ''}
      {hasBoth && <> and </>}
      {warningText || ''}
    </Text>
  )
}
