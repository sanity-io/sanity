import {Card, Flex} from '@sanity/ui'
import React, {useMemo} from 'react'
import {useNumber} from '@sanity/ui-workshop'
import {CommentReactionsUsersTooltipContent} from '../components'
import {useCurrentUser} from 'sanity'

const USER_IDS = [
  'p8U8TipFc', // Herman 1
  'pJnhH8iJq', // Kayla
  'pP5s3g90N', // Rob
  'pZyoPHKUs', // PK,
  'pYujXoFji', // Evan
  'pJHJAZp6o', // Nina
  'pDcuA2pYZ', // Herman 2
  'p8xDvUMxC', // Pedro
  'pHbfjdoZr', // Fred
]

export default function CommentReactionsUsersTooltipContentStory() {
  const currentUser = useCurrentUser()
  const usersLength = useNumber('Users length', USER_IDS.length, 'Props')
  const userIds = useMemo(() => USER_IDS.slice(0, usersLength), [usersLength])

  if (!currentUser) return null

  return (
    <Flex height="fill" align="center" justify="center">
      <Card border>
        <CommentReactionsUsersTooltipContent
          currentUser={currentUser}
          reactionName=":eyes:"
          userIds={userIds}
        />
      </Card>
    </Flex>
  )
}
