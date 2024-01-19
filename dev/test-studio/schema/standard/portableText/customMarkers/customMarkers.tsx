import {Card, Stack, Text} from '@sanity/ui'
import {RenderCustomMarkers} from 'sanity'

export const renderCustomMarkers: RenderCustomMarkers = (markers) => {
  return (
    <Stack space={1}>
      {markers.map((marker, index) => (
        <Card key={index} padding={2} tone="transparent">
          <Text size={1}>{String(marker.data)}</Text>
        </Card>
      ))}
    </Stack>
  )
}
