// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {useMemo} from 'react'
import CustomMarkers from 'part:@sanity/form-builder/input/block-editor/block-markers-custom-default'
import {Marker, isValidationMarker} from '@sanity/types'
import {Box, Flex, Stack, Text, Theme} from '@sanity/ui'
import {InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import styled, {css} from 'styled-components'
import {RenderCustomMarkers} from '../types'

type Props = {
  markers: Marker[]
  renderCustomMarkers?: RenderCustomMarkers
}

const getIcon = (level) => {
  if (level === 'warning') {
    return <WarningOutlineIcon />
  }

  return <InfoOutlineIcon />
}

const IconText = styled(Text)(({theme}: {theme: Theme}) => {
  return css`
    &[data-warning] {
      color: ${theme.sanity.color.muted.caution.enabled.fg};
    }

    &[data-error] {
      color: ${theme.sanity.color.muted.critical.enabled.fg};
    }
  `
})

export default function Markers(props: Props) {
  const {markers, renderCustomMarkers} = props

  const customMarkersForBlock = useMemo(
    () => markers.filter((marker) => !isValidationMarker(marker)),
    [markers]
  )
  const validationMarkersForBlock = useMemo(
    () => markers.filter((marker) => isValidationMarker(marker)),
    [markers]
  )
  if (markers.length === 0) {
    return null
  }

  return (
    <Stack space={1}>
      {validationMarkersForBlock.length > 0 &&
        validationMarkersForBlock.map(({item, level}, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <Flex key={`validationItem-${index}`}>
            <Box
              marginRight={2}
              marginBottom={index + 1 === validationMarkersForBlock.length ? 0 : 2}
            >
              <IconText
                size={1}
                data-error={level === 'error' ? '' : undefined}
                data-warning={level === 'warning' ? '' : undefined}
              >
                {getIcon(level)}
              </IconText>
            </Box>
            <Box>
              <Text size={1}>{item?.message || 'Error'}</Text>
            </Box>
          </Flex>
        ))}
      {customMarkersForBlock.length > 0 && (
        <Box marginTop={validationMarkersForBlock.length > 0 ? 3 : 0}>
          {renderCustomMarkers && renderCustomMarkers(customMarkersForBlock)}
          {!renderCustomMarkers && <CustomMarkers markers={markers} />}
        </Box>
      )}
    </Stack>
  )
}
