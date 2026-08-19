import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type FormNodeValidation} from '@sanity/types'
import {Flex, Stack, Text, type Theme} from '@sanity/ui'
import {css, styled} from 'styled-components'
import {Box} from 'ui5'

import {type PortableTextMarker, type RenderCustomMarkers} from '../../../types/_transitional'
import {useFormBuilder} from '../../../useFormBuilder'

export interface MarkersProps {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  markers: PortableTextMarker[]
  validation: FormNodeValidation[]
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const IconText = styled(Text)(({theme}: {theme: Theme}) => {
  return css`
    &[data-info] {
      color: ${theme.sanity.color.muted.primary.enabled.fg /* oxlint-disable-line no-deprecated -- will fix in follow up PR */};
    }

    &[data-warning] {
      color: ${theme.sanity.color.muted.caution.enabled.fg /* oxlint-disable-line no-deprecated -- will fix in follow up PR */};
    }

    &[data-error] {
      color: ${theme.sanity.color.muted.critical.enabled.fg /* oxlint-disable-line no-deprecated -- will fix in follow up PR */};
    }
  `
})

export function DefaultMarkers(props: MarkersProps) {
  const {markers, validation, renderCustomMarkers} = props
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
