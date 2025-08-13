import {Button, Flex} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {CommentReactionsMenuButton} from '../components/reactions/CommentReactionsMenuButton'
import {COMMENT_REACTION_OPTIONS} from '../constants'
import {type CommentReactionOption, type CommentReactionShortNames} from '../types'

export default function CommentReactionsMenuButtonStory() {
  const [selectedOptions, setSelectedOptions] = useState<CommentReactionShortNames[]>([])

  const handleOnSelect = useCallback(
    (option: CommentReactionOption) => {
      const hasOption = selectedOptions.includes(option.shortName)

      if (hasOption) {
        setSelectedOptions((prev) => prev.filter((o) => o !== option.shortName))
      } else {
        setSelectedOptions((prev) => [...prev, option.shortName])
      }
    },
    [selectedOptions],
  )

  return (
    <Flex align="center" justify="center" height="fill">
      <CommentReactionsMenuButton
        // eslint-disable-next-line react/jsx-no-bind
        renderMenuButton={({open}) => <Button text="Reactions" selected={open} />}
        onSelect={handleOnSelect}
        options={COMMENT_REACTION_OPTIONS}
        mode="default"
      />
    </Flex>
  )
}
