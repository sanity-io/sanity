import {Badge, Box, Stack} from '@sanity/ui'
import {type ComponentType, type PropsWithChildren} from 'react'

type Props = PropsWithChildren<{
  name: string
}>

export const LazyContainer: ComponentType<Props> = ({name, children}) => (
  <Stack space={2}>
    <Box>
      <Badge tone="primary">{name}</Badge>
    </Box>
    {children}
  </Stack>
)
