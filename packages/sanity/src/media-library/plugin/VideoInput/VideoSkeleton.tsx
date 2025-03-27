import {Flex, Skeleton, Stack, TextSkeleton} from '@sanity/ui'
import {vars} from '@sanity/ui/css'

export function VideoSkeleton() {
  return (
    <Flex align="center" justify="flex-start" padding={2}>
      <Skeleton radius={1} animated style={{padding: vars.space[3]}} />
      <Stack flex={1} gap={2} marginLeft={3}>
        <TextSkeleton style={{width: '100%'}} radius={1} animated />
        <TextSkeleton style={{width: '100%'}} radius={1} animated />
      </Stack>
    </Flex>
  )
}
