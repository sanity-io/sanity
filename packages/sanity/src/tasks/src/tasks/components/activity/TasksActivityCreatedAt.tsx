import {Flex, Text, TextSkeleton} from '@sanity/ui'
import {memo} from 'react'
import {useUser} from 'sanity'
import styled from 'styled-components'

import {Tooltip} from '../../../../../ui-components'
import {UpdatedTimeAgo} from './helpers'
import {ActivityItem} from './TasksActivityItem'

const UserSkeleton = styled(TextSkeleton)`
  max-width: 15ch;
  width: '100%';
`

interface TasksActivityCreatedAtProps {
  createdAt: string
  authorId: string
}

export const TasksActivityCreatedAt = memo(
  function TasksActivityCreatedAt(props: TasksActivityCreatedAtProps) {
    const {createdAt, authorId} = props
    const [user, loading] = useUser(authorId)
    const {timeAgo, formattedDate} = UpdatedTimeAgo(createdAt)

    return (
      <ActivityItem userId={authorId}>
        <Flex align="center" paddingTop={1}>
          <Text size={1} muted>
            <strong style={{fontWeight: 600}}>
              {loading ? <UserSkeleton /> : user?.displayName ?? 'Unknown user'}{' '}
            </strong>
            created this task •{' '}
            <Tooltip content={formattedDate} placement="top-end">
              <time dateTime={createdAt}>{timeAgo}</time>
            </Tooltip>
          </Text>
        </Flex>
      </ActivityItem>
    )
  },
  (prevProps, nextProps) => {
    return prevProps.createdAt === nextProps.createdAt
  },
)
