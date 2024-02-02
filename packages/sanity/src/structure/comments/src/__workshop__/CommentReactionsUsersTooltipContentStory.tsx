import {Card, Flex} from '@sanity/ui'
import React, {useMemo} from 'react'
import {useNumber, useSelect} from '@sanity/ui-workshop'
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

const INCLUDES_YOU_OPTIONS = {
  First: 'first',
  Last: 'last',
  No: 'no',
}

export default function CommentReactionsUsersTooltipContentStory() {
  const currentUser = useCurrentUser()
  const currentUserId = currentUser?.id
  const usersLength = useNumber('Users length', USER_IDS.length, 'Props') || USER_IDS.length
  const includesYou = useSelect('Includes you', INCLUDES_YOU_OPTIONS, 'last', 'Props')

  const userIds = useMemo(() => {
    if (!currentUserId) {
      return USER_IDS.slice(0, usersLength)
    }

    const withoutYou = USER_IDS.filter((id) => id !== currentUserId)
    if (includesYou === 'first') {
      return [currentUserId, ...withoutYou].slice(0, usersLength)
    }

    if (includesYou === 'last') {
      return [...withoutYou.slice(0, usersLength - 1), currentUserId]
    }

    return withoutYou.slice(0, usersLength)
  }, [usersLength, includesYou, currentUserId])

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
