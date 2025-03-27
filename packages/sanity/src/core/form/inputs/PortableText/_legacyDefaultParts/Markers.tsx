import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {type FormNodeValidation} from '@sanity/types'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

import {type PortableTextMarker, type RenderCustomMarkers} from '../../../types'
import {useFormBuilder} from '../../../useFormBuilder'

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

const IconText = styled(Text)`
  &[data-info] {
    color: ${vars.color.tinted.primary.fg[0]};
  }

  &[data-warning] {
    color: ${vars.color.tinted.caution.fg[0]};
  }

  &[data-error] {
    color: ${vars.color.tinted.critical.fg[0]};
  }
`

export function DefaultMarkers(props: MarkersProps) {
  const {markers, validation, renderCustomMarkers} = props
  const {CustomMarkers} = useFormBuilder().__internal.components

  if (markers.length === 0 && validation.length === 0) {
    return null
  }

  return (
    <Stack gap={1}>
      {validation.length > 0 &&
        validation.map(({message, level}, index) => (
          <Flex key={`validationItem-${index}`}>
            <Box marginRight={2} marginBottom={index + 1 === validation.length ? 0 : 2}>
              <IconText
                size={1}
                data-error={level === 'error' ? '' : undefined}
                data-warning={level === 'warning' ? '' : undefined}
                data-info={level === 'info' ? '' : undefined}
              >
                {getIcon(level)}
              </IconText>
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
