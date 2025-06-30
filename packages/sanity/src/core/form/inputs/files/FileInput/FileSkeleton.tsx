import {Flex, Skeleton, Stack, TextSkeleton} from '@sanity/ui'

export function FileSkeleton() {
  return (
    <Flex align="center" justify="flex-start" padding={2}>
      <Skeleton radius={1} animated style={{width: 24, height: 24}} />
      <Stack flex={1} gap={2} marginLeft={3}>
        <TextSkeleton style={{width: '100%'}} radius={1} animated />
        <TextSkeleton style={{width: '100%'}} radius={1} animated />
      </Stack>
    </Flex>
  )
}
