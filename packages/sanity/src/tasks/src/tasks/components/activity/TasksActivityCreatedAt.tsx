import {DotIcon} from '@sanity/icons'
import {Box, Flex, Text, TextSkeleton} from '@sanity/ui'
import {useMemo} from 'react'
import {useDateTimeFormat, type UseDateTimeFormatOptions, UserAvatar, useUser} from 'sanity'
import styled from 'styled-components'

const UserSkeleton = styled(TextSkeleton)`
  max-width: 15ch;
  width: '100%';
`

const DATE_FORMAT_OPTIONS: UseDateTimeFormatOptions = {
  dateStyle: 'medium',
}

interface TasksActivityCreatedAtProps {
  createdAt: string
  authorId: string
}

export function TasksActivityCreatedAt(props: TasksActivityCreatedAtProps) {
  const {createdAt, authorId} = props
  const [user, loading] = useUser(authorId)

  const dateFormatter = useDateTimeFormat(DATE_FORMAT_OPTIONS)

  const dueByeDisplayValue = useMemo<string | undefined>(() => {
    const formattedDate = dateFormatter.format(new Date(createdAt))
    const [day] = formattedDate.split(',')
    const hour = new Date(createdAt).getHours()
    const minutes = new Date(createdAt).getMinutes()

    return `${day}, ${hour}:${minutes}`
  }, [createdAt, dateFormatter])

  if (loading) {
    return <UserSkeleton animated size={1} />
  }

  if (!user) {
    return <Text size={1}>Unknown user created this task at {createdAt}</Text>
  }

  return (
    <Flex align="center">
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
        <b>{user.displayName}</b> created this task <DotIcon /> {dueByeDisplayValue}
      </Text>
    </Flex>
  )
}
