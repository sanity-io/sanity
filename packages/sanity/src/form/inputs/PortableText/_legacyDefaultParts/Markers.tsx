import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {Box, Flex, Stack, Text, Theme} from '@sanity/ui'
import React from 'react'
import styled, {css} from 'styled-components'
import {NodeValidation, PortableTextMarker, RenderCustomMarkers} from '../../../types'
import {useFormBuilder} from '../../../useFormBuilder'

export interface MarkersProps {
  markers: PortableTextMarker[]
  validation: NodeValidation[]
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

const IconText = styled(Text)(({theme}: {theme: Theme}) => {
  return css`
    &[data-info] {
      color: ${theme.sanity.color.muted.primary.enabled.fg};
    }

    &[data-warning] {
      color: ${theme.sanity.color.muted.caution.enabled.fg};
    }

    &[data-error] {
      color: ${theme.sanity.color.muted.critical.enabled.fg};
    }
  `
})

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
          // eslint-disable-next-line react/no-array-index-key
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
