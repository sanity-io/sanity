import {Box, Card, Flex, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

export function Chip(props: {avatar?: ReactNode; text: ReactNode}): JSX.Element {
  const {avatar, text} = props

  return (
    <Card muted radius="full">
      <Flex>
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
