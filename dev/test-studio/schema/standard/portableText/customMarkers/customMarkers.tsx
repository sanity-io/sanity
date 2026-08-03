import {Card, Stack, Text} from '@sanity/ui'
import {type RenderCustomMarkers} from 'sanity'

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export const renderCustomMarkers: RenderCustomMarkers = (markers) => {
  return (
    <Stack gap={1}>
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
