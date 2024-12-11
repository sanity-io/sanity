import {Box, Card, Flex, Text} from '@sanity/ui'
import {type ComponentType, type ReactNode} from 'react'

interface Props {
  avatar?: ReactNode
  text: ReactNode
  icon?: ReactNode
}

export const Chip: ComponentType<Props> = (props) => {
  const {avatar, text, icon} = props

  return (
    <Card muted radius="full">
      <Flex align={'center'}>
        {icon && (
          <Box padding={1} marginLeft={1}>
            {icon}
          </Box>
        )}
        {avatar && (
          <Box padding={1}>
            <div style={{margin: -1}}>{avatar}</div>
          </Box>
        )}

        <Box padding={2} paddingLeft={avatar ? 1 : undefined}>
          <Text muted size={1}>
            {text}
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}
