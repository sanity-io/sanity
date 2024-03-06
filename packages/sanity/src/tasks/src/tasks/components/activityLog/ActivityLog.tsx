// This file is a WIP.
import {DotIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {
  type FormPatch,
  type PatchEvent,
  type Path,
  useCurrentUser,
  useDateTimeFormat,
  UserAvatar,
  useUser,
} from 'sanity'

import {type TaskDocument} from '../../types'
import {TasksSubsribers} from './TasksSubscribers'

function AddComment() {
  const currentUser = useCurrentUser()
  const [user] = useUser(currentUser?.id || '')

  if (!user) {
    return <Text size={1}>Unknown user can't add comments </Text>
  }
  return (
    <Flex align={'center'}>
      <Box marginRight={2}>
        <UserAvatar
          user={user}
          size={0}
          // @ts-expect-error `color` is not a valid prop on UserAvatar but it is sent to the `avatar`
          color={user.imageUrl ? null : undefined}
          __unstable_hideInnerStroke
        />
      </Box>
      <Card paddingX={2} paddingY={3} radius={3} tone="transparent" style={{width: '100%'}}>
        <Text muted>Add comment</Text>
      </Card>
    </Flex>
  )
}

function CreatedAt({createdAt, authorId}: {createdAt: string; authorId: string}) {
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
        <strong style={{fontWeight: 600}}>{user.displayName} </strong>
        created this task <DotIcon /> {dueByeDisplayValue}
      </Text>
    </Flex>
  )
}

export function ActivityLog(props: {
  value: TaskDocument
  path?: Path
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
}) {
  const {value, onChange, path} = props

  return (
    <Box marginTop={5}>
      <Card borderTop paddingTop={5}>
        <Flex align="center" justify="space-between">
          <Text size={2} weight="semibold">
            Activity
          </Text>
          <TasksSubsribers value={value} onChange={onChange} path={path} />
        </Flex>
      </Card>
      <Stack marginTop={4} space={4}>
        {value.createdByUser && (
          <CreatedAt createdAt={value.createdByUser} authorId={value.authorId} />
        )}
        <AddComment />
      </Stack>
    </Box>
  )
}
