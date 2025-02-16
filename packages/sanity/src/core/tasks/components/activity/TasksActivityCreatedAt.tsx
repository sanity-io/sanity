import {Flex, Text, TextSkeleton} from '@sanity/ui'
import {memo} from 'react'
import {styled} from 'styled-components'

import {Tooltip} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useUser} from '../../../store'
import {tasksLocaleNamespace} from '../../i18n'
import {NoWrap, useUpdatedTimeAgo} from './helpers'
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
    const {timeAgo, formattedDate} = useUpdatedTimeAgo(createdAt)
    const {t} = useTranslation(tasksLocaleNamespace)
    return (
      <ActivityItem userId={authorId}>
        <Flex align="center" paddingTop={1}>
          <Text size={1} muted>
            <strong style={{fontWeight: 600}}>
              {loading ? (
                <UserSkeleton />
              ) : (
                (user?.displayName ?? t('panel.activity.unknown-user'))
              )}{' '}
            </strong>
            {t('panel.activity.created-fragment')} •{' '}
            <Tooltip content={formattedDate} placement="top-end">
              <NoWrap>
                <time dateTime={createdAt}>{timeAgo}</time>
              </NoWrap>
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
