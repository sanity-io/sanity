import {type PortableTextMarker} from '../../../../types'
import {CommentIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'

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
