import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {type FormNodeValidation} from '@sanity/types'
import {Box, Flex, Stack, Text} from '@sanity/ui'

import {type PortableTextMarker, type RenderCustomMarkers} from '../../../types'
import {useFormBuilder} from '../../../useFormBuilder'
import {iconTextError, iconTextInfo, iconTextWarning} from './Markers.css'

export interface MarkersProps {
  markers: PortableTextMarker[]
  validation: FormNodeValidation[]
  renderCustomMarkers?: RenderCustomMarkers
}

const getIcon = (level: 'error' | 'warning' | 'info') => {
  if (level === 'error') {
    return <ErrorOutlineIcon />
  }

  if (level === 'warning') {
    return <WarningOutlineIcon />
  }

  return <InfoOutlineIcon />
}

const ICON_CLASS_MAP = {
  info: iconTextInfo,
  warning: iconTextWarning,
  error: iconTextError,
} as const

export function DefaultMarkers(props: MarkersProps) {
  const {markers, validation, renderCustomMarkers} = props
  const {CustomMarkers} = useFormBuilder().__internal.components

  if (markers.length === 0 && validation.length === 0) {
    return null
  }

  return (
    <Stack space={1}>
      {validation.length > 0 &&
        validation.map(({message, level}, index) => (
          <Flex key={`validationItem-${index}`}>
            <Box marginRight={2} marginBottom={index + 1 === validation.length ? 0 : 2}>
              <Text
                size={1}
                className={ICON_CLASS_MAP[level]}
              >
                {getIcon(level)}
              </Text>
            </Box>
            <Box>
              <Text size={1}>{message || 'Error'}</Text>
            </Box>
          </Flex>
        ))}

      {markers.length > 0 && (
        <Box marginTop={validation.length > 0 ? 3 : 0}>
          {renderCustomMarkers && renderCustomMarkers(markers)}
          {!renderCustomMarkers && <CustomMarkers markers={markers} />}
        </Box>
      )}
    </Stack>
  )
}
