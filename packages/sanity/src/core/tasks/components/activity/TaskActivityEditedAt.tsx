import {memo} from 'react'
import {Text, Flex, Box, Icon} from 'ui5'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
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
            <Icon icon={icon} />
          </Box>
        </Box>
        <Text muted size={1} as="div" trim={true}>
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
