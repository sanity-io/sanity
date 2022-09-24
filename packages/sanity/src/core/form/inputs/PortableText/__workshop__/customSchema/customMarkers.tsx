import {Box, Flex, Text} from '@sanity/ui'
import React from 'react'
import {CommentIcon} from '@sanity/icons'
import {PortableTextMarker} from '../../../../types'

export function renderCustomMarkers(markers: PortableTextMarker[]) {
  return markers.map((marker) => {
    if (marker.type === 'customMarkerTest') {
      return (
        <Box key={`marker-${marker.type}-${JSON.stringify(marker.path)}`}>
          <Flex>
            <Text size={1}>
              <CommentIcon /> Two comments
            </Text>
          </Flex>
        </Box>
      )
    }

    return null
  })
}
