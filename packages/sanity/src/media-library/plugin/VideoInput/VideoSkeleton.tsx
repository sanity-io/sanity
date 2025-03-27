import {Card, Flex, Skeleton, Stack, TextSkeleton} from '@sanity/ui'
import {vars} from '@sanity/ui/css'

export function VideoSkeleton({error}: {error?: Error}) {
  return (
    <Card padding={0} radius={0} tone={error ? 'critical' : 'default'}>
      <Flex align="center" justify="flex-start" padding={2}>
        <Skeleton radius={1} animated={!error} style={{padding: vars.space[3]}} />
        <Stack flex={1} gap={2} marginLeft={3}>
          <TextSkeleton style={{width: '100%'}} radius={1} animated={!error} />
          <TextSkeleton style={{width: '100%'}} radius={1} animated={!error} />
        </Stack>
      </Flex>
    </Card>
  )
}
