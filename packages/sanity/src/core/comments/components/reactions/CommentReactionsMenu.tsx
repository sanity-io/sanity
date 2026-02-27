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
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(0)

  const handleRootKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const focusableLen = rootElement?.querySelectorAll('button').length ?? 0

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
    [rootElement],
  )

  const handleOptionClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const index = rootElement
        ? Array.from(rootElement.querySelectorAll('button')).indexOf(event.currentTarget)
        : -1
      setFocusedIndex(index)
      onSelect(options[index])
    },
    [rootElement, onSelect, options],
  )

  // Focus the button at the focused index.
  useEffect(() => {
    if (!rootElement) return
    const focusableElements = Array.from(rootElement.querySelectorAll('button'))
    if (focusableElements.length > 0) {
      focusableElements[focusedIndex].focus()
    }
  }, [focusedIndex, rootElement])

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
            key={o.shortName}
            aria-label={t('reactions.react-with-aria-label', {
              reactionName: o.title || o.shortName,
            })}
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
