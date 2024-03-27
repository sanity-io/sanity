import {Box, Flex} from '@sanity/ui'
import styled from 'styled-components'

import {TasksUserAvatar} from '../TasksUserAvatar'

const ActivityChildrenRoot = styled(Flex)`
  height: 100%;
`
const ActivityItemChildrenContainer = styled.div`
  width: 100%;
`

interface ActivityItemProps {
  userId: string
  children: React.ReactNode
}
export function ActivityItem({userId, children}: ActivityItemProps) {
  return (
    <Flex>
      <Box marginRight={3} paddingTop={1}>
        <TasksUserAvatar user={{id: userId}} size={0} />
      </Box>
      <ActivityChildrenRoot align="center" flex={1}>
        <ActivityItemChildrenContainer>{children}</ActivityItemChildrenContainer>
      </ActivityChildrenRoot>
    </Flex>
  )
}
