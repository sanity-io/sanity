import {Skeleton, Stack, TextSkeleton} from '@sanity/ui'
import {Flex} from 'ui5'

export function FileSkeleton() {
  return (
    <Flex alignItems="center" justifyContent="flex-start" padding={2}>
      <Skeleton padding={3} radius={1} animated />
      <Stack flex={1} gap={2} marginLeft={3}>
        <TextSkeleton style={{width: '100%'}} radius={1} animated />
        <TextSkeleton style={{width: '100%'}} radius={1} animated />
      </Stack>
    </Flex>
  )
}
