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

export const StyledPopover = styled(Popover)(() => {
  return css`
    // Position the Popover relative to the @
    transform: translate(6px, 6px); // todo: improve

    [data-ui='Popover__wrapper'] {
      border-radius: ${({theme}) => theme.sanity.radius[3]}px;
      display: flex;
      flex-direction: column;
      width: 300px; // todo: improve
      overflow: clip;
      overflow: hidden;
      position: relative;
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
          disabled={!mentionsMenuOpen}
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
          open={mentionsMenuOpen}
          placement="bottom-end"
          portal
          ref={setPopoverElement}
          referenceElement={cursorElement}
        />
      </PortalProvider>
      <EditableWrapStack ref={rootElementRef} data-ui="EditableWrapStack">
        <PortableTextEditable
          data-ui="EditableElement"
          onKeyDown={handleKeyDown}
          onBeforeInput={onBeforeInput}
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
