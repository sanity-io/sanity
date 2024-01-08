// eslint-disable-next-line no-restricted-imports
import {Button as UIButton, Grid} from '@sanity/ui'
import React, {useCallback, useEffect, useState} from 'react'
import {CommentReactionOption, CommentReactionShortNames} from '../../types'
import {COMMENT_REACTION_EMOJIS} from '../../constants'

const GRID_COLUMNS = 6

interface CommentReactionsMenuProps {
  options: CommentReactionOption[]
  selectedOptionNames?: CommentReactionShortNames[]
  onSelect: (option: CommentReactionOption) => void
}

export function CommentReactionsMenu(props: CommentReactionsMenuProps) {
  const {options, onSelect, selectedOptionNames} = props

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
        const selected = selectedOptionNames?.includes(o.shortName)
        const emoji = COMMENT_REACTION_EMOJIS[o.shortName]

        return (
          <UIButton
            aria-label={`React with ${o.title || o.shortName}`}
            key={o.shortName}
            mode="bleed"
            onClick={handleOptionClick}
            padding={2}
            role="menuitem"
            selected={selected}
            text={emoji}
          />
        )
      })}
    </Grid>
  )
}