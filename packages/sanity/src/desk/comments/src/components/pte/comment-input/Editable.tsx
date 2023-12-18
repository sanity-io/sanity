import React, {KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useClickOutside} from '@sanity/ui'
import {
  EditorSelection,
  PortableTextEditable,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import styled, {css} from 'styled-components'
import {isEqual} from 'lodash'
import {isPortableTextSpan, isPortableTextTextBlock} from '@sanity/types'
import {Popover, PopoverProps} from '../../../../../../ui-components'
import {MentionsMenu, MentionsMenuHandle} from '../../mentions'
import {renderBlock, renderChild} from '../render'
import {useCommentInput} from './useCommentInput'
import {useCursorElement} from './useCursorElement'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['bottom', 'top']
const INLINE_STYLE: React.CSSProperties = {outline: 'none'}
const EMPTY_ARRAY: [] = []

const PlaceholderWrapper = styled.span(() => {
  return css`
    overflow: hidden;
    text-overflow: ellipsis;
    text-wrap: nowrap;
    display: block;
  `
})

export const StyledPopover = styled(Popover)(({theme}) => {
  const {space, radius} = theme.sanity

  return css`
    &[data-placement='bottom'] {
      transform: translateY(${space[1]}px);
    }

    &[data-placement='top'] {
      transform: translateY(-${space[1]}px);
    }

    [data-ui='Popover__wrapper'] {
      border-radius: ${radius[3]}px;
      display: flex;
      flex-direction: column;
      overflow: clip;
      overflow: hidden;
      position: relative;
      width: 300px; // todo: improve
    }
  `
})

interface EditableProps {
  focusLock?: boolean
  onBlur?: (e: React.FormEvent<HTMLDivElement>) => void
  onFocus?: (e: React.FormEvent<HTMLDivElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<Element>) => void
  onSubmit?: () => void
  placeholder?: React.ReactNode
}

export interface EditableHandle {
  setShowMentionOptions: (show: boolean) => void
}

export function Editable(props: EditableProps) {
  const {
    focusLock,
    placeholder = 'Create a new comment',
    onFocus,
    onBlur,
    onKeyDown,
    onSubmit,
  } = props
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const rootElementRef = useRef<HTMLDivElement | null>(null)
  const editableRef = useRef<HTMLDivElement | null>(null)
  const mentionsMenuRef = useRef<MentionsMenuHandle | null>(null)

  const selection = usePortableTextEditorSelection()

  const {
    canSubmit,
    closeMentions,
    insertMention,
    mentionOptions,
    mentionsMenuOpen,
    mentionsSearchTerm,
    onBeforeInput,
    value,
  } = useCommentInput()

  const cursorElement = useCursorElement({
    disabled: !mentionsMenuOpen,
    rootElement: rootElementRef.current,
  })

  const renderPlaceholder = useCallback(
    () => <PlaceholderWrapper>{placeholder}</PlaceholderWrapper>,
    [placeholder],
  )

  const handleClickOutside = useCallback(() => {
    if (mentionsMenuOpen) {
      closeMentions()
    }
  }, [closeMentions, mentionsMenuOpen])

  useClickOutside(handleClickOutside, [popoverElement])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          // Shift enter is used to insert a new line,
          // keep the default behavior
          if (event.shiftKey) {
            break
          }
          // Enter is being used both to select something from the mentionsMenu
          // or to submit the comment. Prevent the default behavior.
          event.preventDefault()
          event.stopPropagation()

          // If the mention menu is open close it, but don't submit.
          if (mentionsMenuOpen) {
            closeMentions()
            break
          }

          // Submit the comment if eligible for submission
          if (onSubmit && canSubmit) {
            onSubmit()
          }
          break

        case 'Escape':
        case 'ArrowLeft':
        case 'ArrowRight':
          if (mentionsMenuOpen) {
            // stop these events if the menu is open
            event.preventDefault()
            event.stopPropagation()
            closeMentions()
          }
          break
        default:
      }
      // Call parent key handler
      if (onKeyDown) onKeyDown(event)
    },
    [canSubmit, closeMentions, mentionsMenuOpen, onKeyDown, onSubmit],
  )

  const initialSelectionAtEndOfContent: EditorSelection | undefined = useMemo(() => {
    if (selection) {
      return undefined
    }
    const lastBlock = (value || EMPTY_ARRAY).slice(-1)[0]
    const lastChild = isPortableTextTextBlock(lastBlock)
      ? lastBlock.children.slice(-1)[0]
      : undefined
    if (!lastChild) {
      return undefined
    }
    const point = {
      path: [{_key: lastBlock._key}, 'children', {_key: lastChild._key}],
      offset: isPortableTextSpan(lastChild) ? lastChild.text.length : 0,
    }
    return {
      focus: point,
      anchor: point,
    }
  }, [value, selection])

  // Update the mentions search term in the mentions menu
  useEffect(() => {
    mentionsMenuRef.current?.setSearchTerm(mentionsSearchTerm)
  }, [mentionsSearchTerm])

  // Close mentions if the user selects text
  useEffect(() => {
    if (mentionsMenuOpen && selection && !isEqual(selection.anchor, selection.focus)) {
      closeMentions()
    }
  }, [mentionsMenuOpen, closeMentions, selection])

  const popoverContent = (
    <MentionsMenu
      inputElement={editableRef.current}
      loading={mentionOptions.loading}
      onSelect={insertMention}
      options={mentionOptions.data || EMPTY_ARRAY}
      ref={mentionsMenuRef}
    />
  )

  return (
    <div ref={rootElementRef}>
      <StyledPopover
        arrow={false}
        constrainSize
        content={popoverContent}
        disabled={!mentionsMenuOpen}
        fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
        open={mentionsMenuOpen}
        placement="bottom"
        ref={setPopoverElement}
        referenceElement={cursorElement}
      />

      <PortableTextEditable
        data-testid="comment-input-editable"
        data-ui="EditableElement"
        onBeforeInput={onBeforeInput}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        ref={editableRef}
        renderBlock={renderBlock}
        renderChild={renderChild}
        renderPlaceholder={renderPlaceholder}
        selection={initialSelectionAtEndOfContent}
        style={INLINE_STYLE}
        tabIndex={focusLock ? 0 : undefined}
      />
    </div>
  )
}
