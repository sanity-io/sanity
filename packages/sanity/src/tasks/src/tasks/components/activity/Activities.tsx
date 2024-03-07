import {CalendarIcon, CircleIcon, DotIcon, EditIcon, LinkIcon, UserIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {type ReactElement} from 'react'
import {useDateTimeFormat, UserAvatar, useRelativeTime, useUser} from 'sanity'

export function CreatedAt({createdAt, authorId}: {createdAt: string; authorId: string}) {
  const [user] = useUser(authorId)

  const dateFormatter = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const formattedDate = dateFormatter.format(new Date(createdAt))

  const createdTimeAgo = useRelativeTime(formattedDate || '', {
    minimal: true,
    useTemporalPhrase: true,
  })

  if (!user) {
    return <Text size={1}>Unknown user created this task at {createdAt}</Text>
  }
  return (
    <Flex>
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
        created this task <DotIcon /> {createdTimeAgo}
      </Text>
    </Flex>
  )
}

interface EditAtProps {
  activity: {
    author: string | null
    field: string
    from?: string | null
    to?: string | null
    timestamp: string
  }
}

export function EditAt(props: EditAtProps) {
  const {author, field, from, to, timestamp} = props.activity
  const dateFormatter = useDateTimeFormat({
    dateStyle: 'medium',
  })

  const formattedDate = dateFormatter.format(new Date(timestamp))

  const updatedTimeAgo = useRelativeTime(formattedDate || '', {
    minimal: true,
    useTemporalPhrase: true,
  })

  function getStringForKey(key: string): KeyStringMapValue | undefined {
    const keyStringMap: {[key: string]: KeyStringMapValue} = {
      assignedTo: {string: 'assigned to', icon: <UserIcon />},
      dueDate: {string: 'changed the due date to', icon: <CalendarIcon />},
      description: {string: 'updated the task description', icon: <EditIcon />},
      title: {string: 'updated the task title', icon: <EditIcon />},
      targetContent: {string: 'set the target content to', icon: <LinkIcon />},
      status: {string: 'changed status to', icon: <CircleIcon />},
    }

    return keyStringMap[key]
  }

  return (
    <Flex>
      <Box marginTop={1} marginLeft={1}>
        <Text>{getStringForKey(field)?.icon}</Text>
      </Box>
      <Flex marginLeft={4}>
        <Text muted size={1}>
          <strong style={{fontWeight: 600}}>{author} </strong>
          {getStringForKey(field)?.string} <strong style={{fontWeight: 600}}>{to}</strong>{' '}
          <DotIcon /> {updatedTimeAgo}
        </Text>
      </Flex>
    </Flex>
  )
}

interface KeyStringMapValue {
  string: string
  icon: ReactElement
}
