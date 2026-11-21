import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type ReleaseDetailProps, useDateTimeFormat} from 'sanity'

function LaunchChecklist({release, documents}: ReleaseDetailProps) {
  const {launchAt} = release.metadata
  const launchDate = typeof launchAt === 'string' ? new Date(launchAt) : undefined
  const formatDateTime = useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})

  return (
    <Card border padding={3} radius={2} tone="positive">
      <Stack gap={3}>
        <Text size={1} weight="semibold">
          Launch checklist
        </Text>
        <Flex justify="space-between">
          <Text size={1} muted>
            Launch date
          </Text>
          <Text size={1}>{launchDate ? formatDateTime.format(launchDate) : 'Not set'}</Text>
        </Flex>
        <Flex justify="space-between">
          <Text size={1} muted>
            Documents to ship
          </Text>
          <Text size={1}>{documents.length}</Text>
        </Flex>
      </Stack>
    </Card>
  )
}

function CampaignSummary({documents}: ReleaseDetailProps) {
  return (
    <Card border padding={3} radius={2} tone="primary">
      <Text size={1}>Campaign release with {documents.length} documents</Text>
    </Card>
  )
}

export function ReleaseDetailExample(props: ReleaseDetailProps) {
  const {category} = props.release.metadata

  if (category === 'productLaunch') return <LaunchChecklist {...props} />
  if (category === 'campaign') return <CampaignSummary {...props} />
  return null
}
