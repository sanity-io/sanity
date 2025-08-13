import {Flex} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useCallback, useState} from 'react'

import {useCurrentUser} from '../../store/user/hooks'
import {CommentReactionsBar} from '../components/reactions/CommentReactionsBar'
import {type CommentReactionItem, type CommentReactionOption} from '../types'

const INITIAL_REACTIONS: CommentReactionItem[] = [
  {
    shortName: ':eyes:',
    userId: 'p8U8TipFc',
    _key: '1',
    addedAt: new Date().toISOString(),
  },
  {
    shortName: ':heavy_plus_sign:',
    userId: 'abc',
    _key: '2',
    addedAt: new Date().toISOString(),
  },
]

export default function CommentReactionsBarStory() {
  const [selectedOptions, setSelectedOptions] = useState<CommentReactionItem[]>(INITIAL_REACTIONS)
  const currentUser = useCurrentUser()

  const handleReactionSelect = useCallback(
    (reaction: CommentReactionOption) => {
      const hasReaction = selectedOptions.some(
        (r) => r.shortName === reaction.shortName && r.userId === currentUser?.id,
      )

      if (hasReaction) {
        const next = selectedOptions
          .map((item) => {
            if (item.shortName === reaction.shortName && item.userId === currentUser?.id) {
              return undefined
            }

            return item
          })
          .filter(Boolean) as CommentReactionItem[]

        setSelectedOptions(next)
        return
      }

      const next = [
        ...selectedOptions,
        {
          ...reaction,
          userId: currentUser?.id || '',
          _key: uuid(),
          addedAt: new Date().toISOString(),
        },
      ]

      setSelectedOptions(next)
    },
    [currentUser?.id, selectedOptions],
  )

  if (!currentUser) return null

  return (
    <Flex align="center" justify="center" height="fill">
      <CommentReactionsBar
        reactions={selectedOptions}
        onSelect={handleReactionSelect}
        currentUser={currentUser}
        mode="default"
      />
    </Flex>
  )
}
