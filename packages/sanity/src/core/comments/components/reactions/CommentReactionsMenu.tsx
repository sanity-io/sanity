// eslint-disable-next-line no-restricted-imports
import {Button as UIButton, Grid} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {useTranslation} from '../../../i18n'
import {COMMENT_REACTION_EMOJIS} from '../../constants'
import {commentsLocaleNamespace} from '../../i18n'
import {type CommentReactionOption} from '../../types'
import {EmojiText} from './EmojiText.styled'

const GRID_COLUMNS = 6

interface CommentReactionsMenuProps {
  options: CommentReactionOption[]
  onSelect: (option: CommentReactionOption) => void
}

export function CommentReactionsMenu(props: CommentReactionsMenuProps) {
  const {options, onSelect} = props
  const {t} = useTranslation(commentsLocaleNamespace)
  const [focusableElements, setFocusableElements] = useState<HTMLButtonElement[]>([])
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(0)

  const handleRootKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const focusableLen = focusableElements.length

      if (event.key === 'ArrowRight') {
        setFocusedIndex((prev) => (prev + 1) % focusableLen)
      }
      if (event.key === 'ArrowLeft') {
        setFocusedIndex((prev) => (prev - 1 + focusableLen) % focusableLen)
      }
      // if (event.key === 'ArrowDown') {
      //   setFocusedIndex((prev) => (prev + GRID_COLUMNS) % focusableLen)
      // }
      // if (event.key === 'ArrowUp') {
      //   setFocusedIndex((prev) => (prev - GRID_COLUMNS + focusableLen) % focusableLen)
      // }
    },
    [focusableElements.length],
  )

  const handleOptionClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const index = focusableElements.indexOf(event.currentTarget)
      setFocusedIndex(index)
      onSelect(options[index])
    },
    [focusableElements, onSelect, options],
  )

  // Get all the buttons in the grid and set them as focusable elements.
  useEffect(() => {
    if (rootElement) {
      const buttons = rootElement.querySelectorAll('button')
      setFocusableElements(Array.from(buttons))
    }
  }, [rootElement])

  // Focus the button at the focused index.
  useEffect(() => {
    if (focusableElements.length > 0) {
      focusableElements[focusedIndex].focus()
    }
  }, [focusableElements, focusedIndex])

  return (
    <Grid
      columns={GRID_COLUMNS}
      gap={1}
      onKeyDown={handleRootKeyDown}
      ref={setRootElement}
      role="menu"
    >
      {options.map((o) => {
        const emoji = COMMENT_REACTION_EMOJIS[o.shortName]

        return (
          <UIButton
            aria-label={t('reactions.react-with-aria-label', {
              reactionName: o.title || o.shortName,
            })}
            key={o.shortName}
            mode="bleed"
            onClick={handleOptionClick}
            padding={2}
            role="menuitem"
            tabIndex={-1}
          >
            <EmojiText align="center" size={2}>
              {emoji}
            </EmojiText>
          </UIButton>
        )
      })}
    </Grid>
  )
}
