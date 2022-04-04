import React from 'react'
import {Skeleton, Flex, Stack, LabelSkeleton} from '@sanity/ui'

export function FileSkeleton() {
  return (
    <Flex align="center" justify="flex-start" padding={2}>
      <Skeleton padding={3} radius={1} animated />
      <Stack flex={1} space={2} marginLeft={3}>
        <LabelSkeleton style={{width: '100%'}} radius={1} animated />
        <LabelSkeleton style={{width: '100%'}} radius={1} animated />
      </Stack>
    </Flex>
  )
}
