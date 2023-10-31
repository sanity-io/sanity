import React, {PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Stack} from '@sanity/ui'
import {
  BlockDecoratorRenderProps,
  BlockRenderProps,
  BlockStyleRenderProps,
  PortableTextEditable,
  PortableTextEditor,
  RangeDecoration,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import styled, {css} from 'styled-components'
import {debounce} from 'lodash'
import isHotkey from 'is-hotkey'
import {useScratchPad} from '../../hooks/useScratchPad'
import {ScratchPadContextValue} from '../../context/ScratchPadProvider'
import {PortableTextInputProps} from '../../../core'
import {TextBlock} from '../rendering/renderBlock'
import {Style} from '../../../core/form/inputs/PortableText/text/Style'
import {Decorator} from '../../../core/form/inputs/PortableText/text'
import {AssistanceRange} from './AssistanceRange'

const INLINE_STYLE: React.CSSProperties = {outline: 'none'}
const MODIFIER_KEY = 'Alt+Control'

const EditableWrapStack = styled(Stack)(() => {
  return css`
    & > div:first-child {
      [data-slate-node='element']:not(:last-child) {
        margin-bottom: 1em; // todo: improve
      }
    }
  `
})

interface EditableProps {
  formProps: PortableTextInputProps
  onBlur?: (e: React.FormEvent<HTMLDivElement>) => void
  onFocus?: (e: React.FormEvent<HTMLDivElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<Element>) => void
  placeholder?: React.ReactNode
}

export function Editable(props: EditableProps) {
  const {placeholder = 'Write down your ideas', onFocus, onBlur, onKeyDown, formProps} = props
  const rootElementRef = useRef<HTMLDivElement | null>(null)
  const editableRef = useRef<HTMLDivElement | null>(null)
  const editor = usePortableTextEditor()
  const editorSelection = usePortableTextEditorSelection()
  const [modifierKeyPressed, setIsModifierKeyPressed] = useState(false)

  const {onEditorBeforeInput, onAssistanceRangeSelect, assistanceSelection, editorFocused} =
    useScratchPad()

  const rangeDecorations: RangeDecoration[] = useMemo(
    () => [
      {
        isRangeInvalid: () => false,
        component: (componentProps: PropsWithChildren) => (
          <AssistanceRange>{componentProps.children}</AssistanceRange>
        ),
        selection: assistanceSelection,
      },
    ],
    [assistanceSelection],
  )

  const renderPlaceholder = useCallback(() => <span>{placeholder}</span>, [placeholder])

  const handleSetAssistantRangeKey = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isHotkey(MODIFIER_KEY, event)) {
      setIsModifierKeyPressed(true)
    }
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      handleSetAssistantRangeKey(event)
      if (onKeyDown) {
        onKeyDown(event)
      }
    },
    [handleSetAssistantRangeKey, onKeyDown],
  )

  const handleKeyUp = useCallback(() => {
    setIsModifierKeyPressed(false)
  }, [])

  // Update the assistance selection when user is done selecting something, and modifier key is pressed
  useEffect(() => {
    createAssistSelectionDebounced(editor, onAssistanceRangeSelect)
  }, [editor, modifierKeyPressed, onAssistanceRangeSelect])

  // These render functions piggybacks on the PT-input's rendering components
  const _renderBlock = useCallback(
    (editorRenderProps: BlockRenderProps) => {
      if (!rootElementRef.current) {
        return <></>
      }
      return (
        <TextBlock
          formProps={formProps}
          blockProps={editorRenderProps}
          boundaryElement={rootElementRef.current}
          scrollElement={rootElementRef.current}
        />
      )
    },
    [formProps],
  )

  const _renderDecorator = useCallback((editorRenderProps: BlockDecoratorRenderProps) => {
    return <Decorator {...editorRenderProps} />
  }, [])

  const _renderStyle = useCallback((editorRenderProps: BlockStyleRenderProps) => {
    return <Style {...editorRenderProps} />
  }, [])

  return (
    <EditableWrapStack ref={rootElementRef} data-ui="EditableWrapStack">
      <PortableTextEditable
        onBeforeInput={onEditorBeforeInput}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        ref={editableRef}
        renderBlock={_renderBlock}
        renderDecorator={_renderDecorator}
        // renderChild={renderChild}
        // renderAnnotation={renderAnnotation}
        renderStyle={_renderStyle}
        rangeDecorations={rangeDecorations}
        renderPlaceholder={renderPlaceholder}
        style={INLINE_STYLE}
      />
    </EditableWrapStack>
  )
}

// This debounced function will get the user selection,
// after the user is done actively selecting, so we don't
// give a new selection to the Assistant before the user
// is done selecting (like when selecting with arrow-keys)
const createAssistSelectionDebounced = debounce(
  (
    editor: PortableTextEditor,
    onAssistanceRangeSelect: ScratchPadContextValue['onAssistanceRangeSelect'],
  ) => {
    const eligibleSelection =
      (PortableTextEditor.isExpandedSelection(editor) && PortableTextEditor.getSelection(editor)) ||
      null
    if (!eligibleSelection) {
      onAssistanceRangeSelect(null)
      return
    }
    onAssistanceRangeSelect(eligibleSelection)
  },
  300,
  {trailing: true, leading: false},
)
