import {Box, Card, Flex, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

export function StatusItem(props: {avatar?: ReactNode; text: ReactNode}) {
  const {avatar, text} = props

  return (
    <Card>
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
