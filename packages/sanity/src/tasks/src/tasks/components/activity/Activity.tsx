import {DotIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useDateTimeFormat, UserAvatar, useUser} from 'sanity'

import {type ActivityProps, type EditAtProps, getStringForKey, UpdatedTimeAgo} from './helpers'

export function CreatedAt({createdAt, authorId}: {createdAt: string; authorId: string}) {
  const [user] = useUser(authorId)

  const dateFormatter = useDateTimeFormat({
    dateStyle: 'medium',
  })
  const dueByeDisplayValue = useMemo<string | undefined>(() => {
    const formattedDate = dateFormatter.format(new Date(createdAt))
    const [day] = formattedDate.split(',')
    const hour = new Date(createdAt).getHours()
    const minutes = new Date(createdAt).getMinutes()
    return `${day}, ${hour}:${minutes}`
  }, [createdAt, dateFormatter])

  if (!user) {
    return <Text size={1}>Unknown user created this task at {createdAt}</Text>
  }

  return (
    <Flex gap={1}>
      <Box marginRight={3}>
        <UserAvatar
          user={user}
          size={0}
          // @ts-expect-error `color` is not a valid prop on UserAvatar but it is sent to the `avatar`
          color={user.imageUrl ? null : undefined}
          __unstable_hideInnerStroke
        />
      </Box>

      <Text size={1}>
        <strong style={{fontWeight: 600}}>{user.displayName} </strong>
        created this task <DotIcon /> {dueByeDisplayValue}
      </Text>
    </Flex>
  )
}

export function EditedAt(props: EditAtProps) {
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

  const updatedTimeAgo = UpdatedTimeAgo(activity.timestamp)

  return (
    <Activity
      text={key}
      updatedTimeAgo={updatedTimeAgo}
      author={activity.author}
      to={showToValue ? activity.to : null}
    />
  )
}

function Activity(props: ActivityProps) {
  return (
    <Flex gap={1}>
      <Box marginTop={1} marginLeft={1}>
        <Text>{getStringForKey(props.text)?.icon}</Text>
      </Box>

      <Flex marginLeft={4}>
        <Text muted size={1}>
          <strong style={{fontWeight: 600}}>{props.author} </strong>
          {getStringForKey(props.text)?.string}{' '}
          <strong style={{fontWeight: 600}}>{props.to}</strong> <DotIcon /> {props.updatedTimeAgo}
        </Text>
      </Flex>
    </Flex>
  )
}
