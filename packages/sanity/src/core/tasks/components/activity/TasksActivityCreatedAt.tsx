import {Text, TextSkeleton} from '@sanity/ui'
import {memo} from 'react'
import {styled} from 'styled-components'
import {Flex} from 'ui5'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useUser} from '../../../store/user/hooks'
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
        <Flex alignItems="center" paddingTop={1}>
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
