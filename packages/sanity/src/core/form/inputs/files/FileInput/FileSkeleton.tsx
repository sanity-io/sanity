import {Skeleton, TextSkeleton} from '@sanity/ui'
import {Flex} from 'ui5'

export function FileSkeleton() {
  return (
    <Flex alignItems="center" justifyContent="flex-start" padding={2}>
      <Skeleton padding={3} radius={1} animated />
      <Flex flexBasis="0%" flexGrow={1} gap={2} marginLeft={3} flexDirection="column">
        <TextSkeleton style={{width: '100%'}} radius={1} animated />
        <TextSkeleton style={{width: '100%'}} radius={1} animated />
      </Flex>
    </Flex>
  )
}
