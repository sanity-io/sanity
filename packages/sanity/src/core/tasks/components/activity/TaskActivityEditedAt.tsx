import {Box, Flex, Text} from '@sanity/ui'
import {memo} from 'react'

import {Tooltip} from '../../../../ui-components'
import {getChangeDetails, NoWrap, UserName, useUpdatedTimeAgo} from './helpers'
import {type FieldChange} from './helpers/parseTransactions'

interface EditedAtProps {
  activity: FieldChange
}

export const EditedAt = memo(
  function EditedAt(props: EditedAtProps) {
    const {activity} = props
    const {formattedDate, timeAgo} = useUpdatedTimeAgo(activity.timestamp)
    const {icon, text, changeTo} = getChangeDetails(activity)

    return (
      <Flex gap={1}>
        <Box marginTop={1} marginLeft={1} marginRight={3}>
          <Box marginRight={1}>
            <Text>{icon}</Text>
          </Box>
        </Box>
        <Text muted size={1}>
          <UserName userId={activity.author} /> {text} {changeTo} •{' '}
          <Tooltip content={formattedDate} placement="top-end">
            <NoWrap>
              <time dateTime={formattedDate}>{timeAgo}</time>
            </NoWrap>
          </Tooltip>
        </Text>
      </Flex>
    )
  },
  (prevProps, nextProps) => {
    return prevProps.activity.timestamp === nextProps.activity.timestamp
  },
)
