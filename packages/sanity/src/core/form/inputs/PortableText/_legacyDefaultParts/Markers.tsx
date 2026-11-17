import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type FormNodeValidation} from '@sanity/types'
import {Text, Box, Flex, VStack, Icon} from 'ui5'

import {type PortableTextMarker, type RenderCustomMarkers} from '../../../types/_transitional'
import {useFormBuilder} from '../../../useFormBuilder'

export interface MarkersProps {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  markers: PortableTextMarker[]
  validation: FormNodeValidation[]
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  renderCustomMarkers?: RenderCustomMarkers
}

const VALIDATION_ICON = {
  error: ErrorOutlineIcon,
  warning: WarningOutlineIcon,
  info: InfoOutlineIcon,
} as const

export function DefaultMarkers(props: MarkersProps) {
  const {markers, validation, renderCustomMarkers} = props
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {CustomMarkers} = useFormBuilder().__internal.components

  if (markers.length === 0 && validation.length === 0) {
    return null
  }

  return (
    <VStack gap={1}>
      {validation.length > 0 &&
        validation.map(({message, level}, index) => (
          <Flex key={`validationItem-${index}`}>
            <Box marginRight={2} marginBottom={index + 1 === validation.length ? 0 : 2}>
              <Icon
                size={1}
                icon={VALIDATION_ICON[level]}
                muted
                tone={level === 'error' ? 'critical' : level === 'warning' ? 'caution' : undefined}
                style={{margin: '-0.375rem'}}
              />
            </Box>
            <Box>
              <Text
                size={1}
                as="div"
                trim={true}
                tone={level === 'error' ? 'critical' : level === 'warning' ? 'caution' : undefined}
              >
                {message || 'Error'}
              </Text>
            </Box>
          </Flex>
        ))}

      {markers.length > 0 && (
        <Box marginTop={validation.length > 0 ? 3 : 0}>
          {renderCustomMarkers && renderCustomMarkers(markers)}
          {!renderCustomMarkers && <CustomMarkers markers={markers} />}
        </Box>
      )}
    </VStack>
  )
}
