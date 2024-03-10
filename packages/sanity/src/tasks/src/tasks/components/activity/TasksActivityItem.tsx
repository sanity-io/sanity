import {Box, Flex} from '@sanity/ui'
import styled from 'styled-components'

import {TasksUserAvatar} from '../TasksUserAvatar'

const ActivityItemChildrenContainer = styled.div`
  width: 100%;
`
export function ActivityItem({userId, children}: {userId: string; children: React.ReactNode}) {
  return (
    <Flex gap={1}>
      <Box marginRight={3} paddingTop={1}>
        <TasksUserAvatar user={{id: userId}} size={0} />
      </Box>
      <ActivityItemChildrenContainer>{children}</ActivityItemChildrenContainer>
    </Flex>
  )
}
