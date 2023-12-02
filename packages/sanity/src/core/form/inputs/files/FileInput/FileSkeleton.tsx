import React from 'react'
import {Skeleton, Flex, Stack, TextSkeleton} from '@sanity/ui'

export function FileSkeleton() {
  return (
    <Flex align="center" justify="flex-start" padding={2}>
      <Skeleton padding={3} radius={1} animated />
      <Stack flex={1} space={2} marginLeft={3}>
        <TextSkeleton style={{width: '100%'}} radius={1} animated />
        <TextSkeleton style={{width: '100%'}} radius={1} animated />
      </Stack>
    </Flex>
  )
}
