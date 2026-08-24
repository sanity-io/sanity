import {Badge, Stack} from '@sanity/ui'
import {type ComponentType, type PropsWithChildren} from 'react'
import {Box} from 'ui5'

type Props = PropsWithChildren<{
  name: string
}>

export const LazyContainer: ComponentType<Props> = ({name, children}) => (
  <Stack gap={2}>
    <Box>
      <Badge tone="primary">{name}</Badge>
    </Box>
    {children}
  </Stack>
)
