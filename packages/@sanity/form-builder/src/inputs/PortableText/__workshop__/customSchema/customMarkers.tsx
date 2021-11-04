import {Box, Flex, Text} from '@sanity/ui'
import React from 'react'
import {CommentIcon} from '@sanity/icons'

export function renderCustomMarkers(markers) {
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
