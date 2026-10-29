import {Flex, Box, type Space} from 'ui5'

import {TasksUserAvatar} from '../TasksUserAvatar'
import {activityChildrenRoot, activityItemChildrenContainer} from './TasksActivityItem.css'

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
      <Flex alignItems="center" flexBasis="0%" flexGrow={1} className={activityChildrenRoot}>
        <div className={activityItemChildrenContainer}>{children}</div>
      </Flex>
    </Flex>
  )
}
