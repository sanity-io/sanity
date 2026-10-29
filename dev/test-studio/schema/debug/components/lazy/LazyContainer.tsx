import {Badge} from '@sanity/ui'
import {type ComponentType, type PropsWithChildren} from 'react'
import {Box, VStack} from 'ui5'

type Props = PropsWithChildren<{
  name: string
}>

export const LazyContainer: ComponentType<Props> = ({name, children}) => (
  <VStack gap={2}>
    <Box>
      <Badge tone="primary">{name}</Badge>
    </Box>
    {children}
  </VStack>
)
