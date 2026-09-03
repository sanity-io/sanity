import {Text, TextSkeleton} from '@sanity/ui'
import {memo} from 'react'
import {Flex} from 'ui5'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useUser} from '../../../store/user/hooks'
import {tasksLocaleNamespace} from '../../i18n'
import {NoWrap, useUpdatedTimeAgo} from './helpers'
import {userSkeleton} from './TasksActivityCreatedAt.css'
import {ActivityItem} from './TasksActivityItem'

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
        <Flex alignItems="center" paddingTop={1}>
          <Text size={1} muted>
            <strong style={{fontWeight: 600}}>
              {loading ? (
                <TextSkeleton className={userSkeleton} />
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
