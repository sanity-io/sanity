import {styled} from 'styled-components'
import {Flex, Box, type Space} from 'ui5'

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
  avatarPaddingTop?: Space
}
export function ActivityItem({avatarPaddingTop = 1, userId, children}: ActivityItemProps) {
  return (
    <Flex>
      <Box marginRight={3} paddingTop={avatarPaddingTop}>
        <TasksUserAvatar user={{id: userId}} size={0} />
      </Box>
      <ActivityChildrenRoot alignItems="center" flexBasis="0%" flexGrow={1}>
        <ActivityItemChildrenContainer>{children}</ActivityItemChildrenContainer>
      </ActivityChildrenRoot>
    </Flex>
  )
}
