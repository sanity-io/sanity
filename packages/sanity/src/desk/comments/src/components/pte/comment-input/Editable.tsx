import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {Popover, PortalProvider, Stack, useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import {PortableTextEditable, usePortableTextEditorSelection} from '@sanity/portable-text-editor'
import styled, {css} from 'styled-components'
import {isEqual} from 'lodash'
import {MentionsMenu, MentionsMenuHandle} from '../../mentions'
import {renderBlock, renderChild} from '../render'
import {useCommentInput} from './useCommentInput'
import {useCursorElement} from './useCursorElement'

const INLINE_STYLE: React.CSSProperties = {outline: 'none'}

const EditableWrapStack = styled(Stack)(() => {
  return css`
    & > div:first-child {
      [data-slate-node='element']:not(:last-child) {
        margin-bottom: 1em; // todo: improve
      }
    }
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
  placeholder?: string
  focusLock?: boolean
}

export interface EditableHandle {
  setShowMentionOptions: (show: boolean) => void
}

export function Editable(props: EditableProps) {
  const {focusLock, placeholder = 'Create a new comment'} = props
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const rootElementRef = useRef<HTMLDivElement | null>(null)
  const editableRef = useRef<HTMLDivElement | null>(null)
  const mentionsMenuRef = useRef<MentionsMenuHandle | null>(null)
  const selection = usePortableTextEditorSelection()

  const {
    closeMentions,
    focusEditor,
    focusEditorEndOfContent,
    focusOnMount,
    insertMention,
    mentionOptions,
    mentionsMenuOpen,
    mentionsSearchTerm,
    onBeforeInput,
  } = useCommentInput()

  const [mounted, setMounted] = useState<boolean>(false)

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  const renderPlaceholder = useCallback(() => <span>{placeholder}</span>, [placeholder])

  useClickOutside(
    useCallback(() => {
      if (mentionsMenuOpen) {
        closeMentions()
      }
    }, [closeMentions, mentionsMenuOpen]),
    [popoverElement],
  )

  // This effect will focus the editor when the component mounts (if focusOnMount context value is true)
  // Use the mounted state to avoid focusing the editor before it's properly rendered.
  useEffect(() => {
    if (mounted && focusOnMount) {
      // Focus to the end of the content.
      focusEditorEndOfContent()
    }
  }, [focusOnMount, focusEditorEndOfContent, mounted])

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

  // Close mentions if the menu itself has focus and user press Escape
  useGlobalKeyDown((event) => {
    if (event.code === 'Escape' && mentionsMenuOpen) {
      closeMentions()
    }
  })

  const cursorElement = useCursorElement({
    disabled: !mentionsMenuOpen,
    rootElement: rootElementRef.current,
  })

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Enter':
          if (mentionsMenuOpen) {
            // Stop the event from creating a new block in the editor here
            event.preventDefault()
            event.stopPropagation()
          }
          break
        case 'Escape':
        case 'ArrowLeft':
        case 'ArrowRight':
          if (mentionsMenuOpen) {
            closeMentions()
            focusEditor()
          }
          break
        default:
      }
    },
    [closeMentions, focusEditor, mentionsMenuOpen],
  )

  return (
    <>
      <PortalProvider element={rootElementRef.current}>
        <StyledPopover
          arrow={false}
          constrainSize
          content={
            <MentionsMenu
              ref={mentionsMenuRef}
              loading={mentionOptions.loading}
              onSelect={insertMention}
              options={mentionOptions.data || []}
              inputElement={editableRef.current}
              // error={mentionOptions.error}
            />
          }
          disabled={!mentionsMenuOpen}
          fallbackPlacements={['bottom', 'top']}
          open={mentionsMenuOpen}
          placement="bottom"
          portal
          ref={setPopoverElement}
          referenceElement={cursorElement}
        />
      </PortalProvider>

      <EditableWrapStack ref={rootElementRef} data-ui="EditableWrapStack">
        <PortableTextEditable
          data-testid="comment-input-editable"
          data-ui="EditableElement"
          onBeforeInput={onBeforeInput}
          onKeyDown={handleKeyDown}
          ref={editableRef}
          renderBlock={renderBlock}
          renderChild={renderChild}
          renderPlaceholder={renderPlaceholder}
          style={INLINE_STYLE}
          tabIndex={focusLock ? 0 : undefined}
        />
      </EditableWrapStack>
    </>
  )
}
