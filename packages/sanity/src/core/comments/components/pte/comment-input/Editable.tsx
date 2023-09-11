import React, {useCallback, useRef, useState} from 'react'
import {Popover, PortalProvider, Stack, useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import {PortableTextEditable} from '@sanity/portable-text-editor'
import styled, {css} from 'styled-components'
import {MentionsMenu} from '../../mentions'
import {useDidUpdate} from '../../../../form'
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
    transform: translateX(6px); // todo: improve

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

  const {
    closeMentions,
    expanded,
    focusEditor,
    focusOnMount,
    insertMention,
    mentionOptions,
    mentionsMenuOpen,
    onBeforeInput,
  } = useCommentInput()

  const cursorElement = useCursorElement({
    disabled: mentionsMenuOpen,
    rootElement: editableRef.current,
  })

  const renderPlaceholder = useCallback(() => <span>{placeholder}</span>, [placeholder])

  useGlobalKeyDown(
    useCallback((event) => event.key === 'Escape' && closeMentions(), [closeMentions]),
  )

  useClickOutside(
    useCallback(() => {
      if (mentionsMenuOpen) {
        closeMentions()
      }
    }, [closeMentions, mentionsMenuOpen]),
    [popoverElement],
  )

  useDidUpdate(expanded, () => {
    if (expanded) {
      focusEditor()
    }
  })

  useDidUpdate(focusOnMount, () => {
    if (focusOnMount) {
      focusEditor()
    }
  })

  return (
    <>
      <PortalProvider element={rootElementRef.current}>
        <StyledPopover
          constrainSize
          hidden={!mentionsMenuOpen || !cursorElement}
          content={
            <MentionsMenu
              loading={mentionOptions.loading}
              onSelect={insertMention}
              options={mentionOptions.data || []}
              // error={mentionOptions.error}
            />
          }
          open={mentionsMenuOpen}
          placement="bottom-start"
          portal
          ref={setPopoverElement}
          referenceElement={cursorElement}
        />
      </PortalProvider>

      <EditableWrapStack ref={rootElementRef} data-ui="EditableWrapStack">
        <PortableTextEditable
          data-ui="EditableElement"
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
