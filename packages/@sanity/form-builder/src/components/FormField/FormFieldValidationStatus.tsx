import {color} from '@sanity/color'
import {ErrorOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {
  isValidationErrorMarker,
  isValidationMarker,
  isValidationWarningMarker,
  Marker,
  ValidationMarker,
} from '@sanity/types'
import {Box, Flex, Placement, Stack, Text, Tooltip} from '@sanity/ui'
import React, {createElement} from 'react'
import {markersToValidationList} from './helpers'
import {FormFieldValidation} from './types'

interface FormFieldValidationStatusProps {
  fontSize?: number | number
  markers?: Marker[]
  placement?: Placement
  showSummary?: boolean
}

export function FormFieldValidationStatus(props: FormFieldValidationStatusProps) {
  const {fontSize, markers = [], placement = 'top', showSummary} = props
  const validationMarkers = markers.filter(isValidationMarker)
  const validation = markersToValidationList(validationMarkers)
  const errors = validation.filter((v) => v.type === 'error')
  const hasErrors = errors.length > 0
  const statusIcon = hasErrors ? ErrorOutlineIcon : WarningOutlineIcon
  const statusColor = hasErrors ? color.red[500].hex : color.yellow[500].hex

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
      placement={placement}
      fallbackPlacements={['bottom', 'right', 'left']}
    >
      <div>
        <Text muted size={fontSize} weight="semibold" style={{color: statusColor}}>
          {createElement(statusIcon)}
        </Text>
      </div>
    </Tooltip>
  )
}

function FormFieldValidationStatusItem(props: {item: FormFieldValidation}) {
  const {item} = props
  const statusIcon = item.type === 'error' ? ErrorOutlineIcon : WarningOutlineIcon
  const statusColor = item.type === 'error' ? color.red[500].hex : color.yellow[500].hex

  return (
    <Flex>
      <Box marginRight={2}>
        <Text size={1} style={{color: statusColor}}>
          {createElement(statusIcon)}
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
