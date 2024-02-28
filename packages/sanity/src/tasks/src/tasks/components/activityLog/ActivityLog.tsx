// This file is a WIP.
import {DotIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useCurrentUser, useDateTimeFormat, useFormValue, UserAvatar, useUser} from 'sanity'

import {Button} from '../../../../../ui-components'
import {type TaskDocument} from '../../types'

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
    <Flex align="center" wrap={'wrap'}>
      <Box marginRight={3}>
        <UserAvatar
          user={user}
          size={0}
          // @ts-expect-error `color` is not a valid prop on UserAvatar but it is sent to the `avatar`
          color={user.imageUrl ? null : undefined}
          __unstable_hideInnerStroke
        />
      </Box>

      <Text size={1} style={{display: 'inline'}}>
        <strong style={{fontWeight: 600}}>{user.displayName} </strong>
        created this task <DotIcon /> {dueByeDisplayValue}
      </Text>
    </Flex>
  )
}

export function ActivityLog() {
  const values = useFormValue([]) as TaskDocument

  return (
    <Box marginTop={5}>
      <Card borderTop paddingTop={5}>
        <Flex align="center" justify="space-between">
          <Text size={2} weight="semibold">
            Activity
          </Text>
          <Button mode="bleed" text="Subscribe" />
        </Flex>
      </Card>
      <Stack marginTop={4} space={4}>
        <CreatedAt createdAt={values._createdAt} authorId={values.authorId} />
        <AddComment />
      </Stack>
    </Box>
  )
}
