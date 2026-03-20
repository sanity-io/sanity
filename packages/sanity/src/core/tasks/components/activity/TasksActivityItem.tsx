import {Box, Flex} from '@sanity/ui'

import {TasksUserAvatar} from '../TasksUserAvatar'
import * as classes from './TasksActivityItem.css'

interface ActivityItemProps {
  userId: string
  children: React.ReactNode
  avatarPaddingTop?: number
}
export function ActivityItem({avatarPaddingTop = 1, userId, children}: ActivityItemProps) {
  return (
    <Flex>
      <Box marginRight={3} paddingTop={avatarPaddingTop}>
        <TasksUserAvatar user={{id: userId}} size={0} />
      </Box>
      <Flex className={classes.activityChildrenRoot} align="center" flex={1}>
        <div className={classes.activityItemChildrenContainer}>{children}</div>
      </Flex>
    </Flex>
  )
}
