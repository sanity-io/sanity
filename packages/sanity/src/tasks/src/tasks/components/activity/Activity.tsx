import {DotIcon} from '@sanity/icons'
import {Box, Flex, Skeleton, Text} from '@sanity/ui'
import {memo} from 'react'
import {useUser} from 'sanity'

import {Tooltip} from '../../../../../ui-components'
import {TasksUserAvatar} from '../TasksUserAvatar'
import {getStringForKey, UpdatedTimeAgo} from './helpers'

export const CreatedAt = memo(
  function CreatedAt({createdAt, authorId}: {createdAt: string; authorId: string}) {
    const [user, loading] = useUser(authorId)
    const {timeAgo, formattedDate} = UpdatedTimeAgo(createdAt)
    return (
      <Flex gap={1}>
        <Box marginRight={3}>
          <TasksUserAvatar user={{id: authorId}} size={0} />
        </Box>
        <Text size={1} muted>
          <strong style={{fontWeight: 600}}>
            {loading ? <Skeleton style={{width: '6ch'}} /> : user?.displayName ?? 'Unknown user'}{' '}
          </strong>
          created this task <DotIcon />{' '}
          <Tooltip content={formattedDate} placement="top-end">
            <time dateTime={createdAt}>{timeAgo}</time>
          </Tooltip>
        </Text>
      </Flex>
    )
  },
  (prevProps, nextProps) => {
    return prevProps.createdAt === nextProps.createdAt
  },
)

interface EditedAtProps {
  activity: {
    author: string
    field: string
    from?: string | null
    to?: string | null
    timestamp: string
  }
}

export const EditedAt = memo(
  function EditedAt(props: EditedAtProps) {
    const {activity} = props
    let key: string = activity.field
    let showToValue: boolean = key === 'dueDate' || key === 'status' || key === 'targetContent'

    //If the status is changed to be done
    if (activity.field === 'status' && activity.to === 'done') {
      key = 'statusDone'
      showToValue = true
    }
    //If a task is unassigned - it goes from having a assignee to be unassigned
    if (activity.field === 'assignedTo' && !!activity.to && activity.from) {
      key = 'unassigned'
    }

    //Set the due date for the first time
    if (activity.field === 'dueDate' && (activity.from === null || undefined) && activity.to) {
      key = 'dueDateSet'
      showToValue = true
    }

    const {formattedDate, timeAgo} = UpdatedTimeAgo(activity.timestamp)
    const {icon, string} = getStringForKey(key) || {icon: null, string: ''}

    return (
      <Flex gap={1}>
        <Box marginTop={1} marginLeft={1} marginRight={3}>
          <Box marginRight={1}>
            <Text>{icon}</Text>
          </Box>
        </Box>
        <Text muted size={1}>
          <strong style={{fontWeight: 600}}>{activity.author} </strong>
          {string} {showToValue && <strong style={{fontWeight: 600}}>{activity.to}</strong>}{' '}
          <DotIcon />{' '}
          <Tooltip content={formattedDate} placement="top-end">
            <time dateTime={formattedDate}>{timeAgo}</time>
          </Tooltip>
        </Text>
      </Flex>
    )
  },
  (prevProps, nextProps) => {
    return prevProps.activity.timestamp === nextProps.activity.timestamp
  },
)
