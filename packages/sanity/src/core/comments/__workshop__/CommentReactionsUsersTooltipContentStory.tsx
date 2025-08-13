import {Card, Flex} from '@sanity/ui'
import {useNumber, useSelect} from '@sanity/ui-workshop'
import {useMemo} from 'react'

import {useCurrentUser} from '../../store/user/hooks'
import {CommentReactionsUsersTooltipContent} from '../components/reactions/CommentReactionsUsersTooltip'

const USER_IDS = [
  'p8U8TipFc', // Herman
  'p8xDvUMxC', // Pedro
  'pHbfjdoZr', // Fred
  'pJHJAZp6o', // Nina
  'pJnhH8iJq', // Kayla
  'pP5s3g90N', // Rob
  'pYujXoFji', // Evan
  'pZyoPHKUs', // PK,
  'p0NFOU0j8',
  'p27ewL8aM',
  'p3exSgYCx',
  'p3mX91pkx',
  'p3q7gJsGh',
  'p4RYRdFtD',
  'p4Tyi2Be5',
  'p4XWCZUTp',
  'p5wOH7PqJ',
  'p6VY1HQtX',
  'p8EtjlXHt',
  'p8GJaTEhN',
  'p8VP6HIsO',
  'pB1Gj4Iz7',
  'pb9vii060',
  'pbE4cL8dw',
  'pbIQRYViC',
  'pbMxAm0Qj',
  'pBRSUdwAJ',
  'pCiWzyki5',
  'pDcuA2pYZ',
  'pDfPKnQrO',
  'pdLr4quHv',
  'pDQYzJbyS',
  'pdYoK6Kp7',
  'pE8yhOisw',
  'peiHzOCZb',
  'pFfLffzqC',
  'pFsSdFmGM',
  'pGCMUtRCb',
  'pgqD5dmam',
  'pgqJhGHOK',
  'pGTrQ3XjF',
  'pH50BaU5I',
  'phbVWmjrI',
  'pHMeQnTse',
  'pI4A1w5GH',
  'pIM6fAehn',
  'piQBPDasj',
  'pJ39KhAdG',
  'pJ61yWhkD',
  'pJtpzGTI1',
  'pJwQAW4ar',
  'pjWxln3AY',
  'pkgL9tnhl',
  'pkjgt3OR6',
  'pkJXiDgg6',
  'pkl4UAKcA',
  'pknOZlpJK',
  'pKpAdLJ9c',
  'plhOuPbx3',
  'pmgRkSrbR',
  'pmSo5nYO0',
  'pNiw1MabI',
  'pnLYqNfv5',
  'pnUTrGziC',
  'pOXhd1h1U',
  'pOzFmNVzz',
  'pPam92fa7',
  'ppFl77r6a',
  'pQn5NPVvX',
  'pqSMwf6hH',
  'pQYsnHhYy',
  'priDVVmy8',
  'pRtKzPCtg',
  'pRxHOPMEQ',
  'pTDl2jw8d',
  'pTo37dr2b',
  'ptOL922n8',
  'pupHHaIz4',
  'pv9Qo84sa',
  'pVlljwWcR',
  'pW8SMtDGG',
  'pWb1e9K6f',
  'pwBMIzme1',
  'pWC7HVg0C',
  'pwUBUc0a6',
  'pWvqoKkxA',
  'pwWxW6Ewy',
  'px6XEtk2S',
  'pXRsidkkq',
  'pYetoJELp',
  'pYg97z75S',
  'pytOk590q',
  'pyxcxgudl',
  'pzAhBTkNX',
]

const INCLUDES_YOU_OPTIONS = {
  First: 'first',
  Last: 'last',
  No: 'no',
}

export default function CommentReactionsUsersTooltipContentStory() {
  const currentUser = useCurrentUser()
  const currentUserId = currentUser?.id
  const usersLength = useNumber('Users length', 10, 'Props') || 10
  const includesYou = useSelect('Includes you', INCLUDES_YOU_OPTIONS, 'last', 'Props')

  const userIds = useMemo(() => {
    // Fill an array of user IDs based on wanted length, in case we do not have enough
    const fullUserIds: string[] = []
    for (let i = 0; i < usersLength; i++) {
      fullUserIds.push(USER_IDS[i % USER_IDS.length])
    }

    if (!currentUserId) {
      return fullUserIds
    }

    const withoutYou = fullUserIds.filter((id) => id !== currentUserId)
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
