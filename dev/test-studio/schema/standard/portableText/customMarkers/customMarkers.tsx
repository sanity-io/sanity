import {Card, Stack, Text} from '@sanity/ui'
import {type RenderCustomMarkers} from 'sanity'

export const renderCustomMarkers: RenderCustomMarkers = (markers) => {
  return (
    <Stack space={1}>
      {markers.map((marker) => (
        <Card
          key={`marker-${marker.type}-${JSON.stringify(marker.path)}`}
          padding={2}
          tone="transparent"
        >
          <Text size={1}>{String(marker.data)}</Text>
        </Card>
      ))}
    </Stack>
  )
}
