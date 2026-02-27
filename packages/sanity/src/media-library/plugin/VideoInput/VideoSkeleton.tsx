import {Card, Flex, Skeleton, Stack, TextSkeleton} from '@sanity/ui'

export function VideoSkeleton({error}: {error?: Error}) {
  return (
    <Card padding={0} radius={0} tone={error ? 'critical' : 'default'}>
      <Flex align="center" justify="flex-start" padding={2}>
        <Skeleton padding={3} radius={1} animated={!error} />
        <Stack flex={1} space={2} marginLeft={3}>
          <TextSkeleton style={{width: '100%'}} radius={1} animated={!error} />
          <TextSkeleton style={{width: '100%'}} radius={1} animated={!error} />
        </Stack>
      </Flex>
    </Card>
  )
}
