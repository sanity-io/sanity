import React, {PropsWithChildren, useCallback, useEffect, useMemo, useRef} from 'react'
import {BoundaryElementProvider, Stack} from '@sanity/ui'
import {
  BlockAnnotationRenderProps,
  BlockChildRenderProps,
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
import {PortableTextTextBlock} from '@sanity/types'
import {useScratchPad} from '../../hooks/useScratchPad'
import {ScratchPadContextValue} from '../../context/ScratchPadProvider'
import {PortableTextInputProps} from '../../../core'
import {Style} from '../../../core/form/inputs/PortableText/text/Style'
import {Decorator} from '../../../core/form/inputs/PortableText/text'
import {Annotation} from '../../../core/form/inputs/PortableText/object/Annotation'
import {InlineObject} from '../../../core/form/inputs/PortableText/object/InlineObject'
import {TextBlock} from '../../../core/form/inputs/PortableText/text/TextBlock'
import {AssistanceRange} from './AssistanceRange'

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

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (onKeyDown) {
        onKeyDown(event)
      }
    },
    [onKeyDown],
  )

  // Update the assistance selection when user is 'done' selecting something
  useEffect(() => {
    createAssistSelectionDebounced(editor, onAssistanceRangeSelect)
  }, [editor, onAssistanceRangeSelect, editorSelection])

  // These render functions starting with a underscore piggybacks on the PT-input's rendering components
  const _renderBlock = useCallback(
    (editorRenderProps: BlockRenderProps) => {
      return (
        <TextBlock
          floatingBoundary={editorRenderProps.editorElementRef.current}
          focused={editorRenderProps.focused}
          isFullscreen
          // eslint-disable-next-line react/jsx-handler-names
          onItemClose={formProps.onItemClose}
          // eslint-disable-next-line react/jsx-handler-names
          onItemOpen={formProps.onItemOpen}
          // eslint-disable-next-line react/jsx-handler-names
          onItemRemove={formProps.onItemRemove}
          // eslint-disable-next-line react/jsx-handler-names
          onPathFocus={formProps.onPathFocus}
          path={formProps.path.concat(editorRenderProps.path)}
          readOnly={formProps.readOnly}
          referenceBoundary={rootElementRef.current}
          renderAnnotation={formProps.renderAnnotation}
          renderField={formProps.renderField}
          renderInlineBlock={formProps.renderInlineBlock}
          renderInput={formProps.renderInput}
          renderItem={formProps.renderItem}
          renderPreview={formProps.renderPreview}
          renderBlock={formProps.renderBlock}
          schemaType={editorRenderProps.schemaType}
          selected={editorRenderProps.selected}
          value={editorRenderProps.value as PortableTextTextBlock}
        >
          {editorRenderProps.children}
        </TextBlock>
      )
    },
    [
      formProps.onItemClose,
      formProps.onItemOpen,
      formProps.onItemRemove,
      formProps.onPathFocus,
      formProps.path,
      formProps.readOnly,
      formProps.renderAnnotation,
      formProps.renderBlock,
      formProps.renderField,
      formProps.renderInlineBlock,
      formProps.renderInput,
      formProps.renderItem,
      formProps.renderPreview,
    ],
  )

  const _renderDecorator = useCallback((editorRenderProps: BlockDecoratorRenderProps) => {
    return <Decorator {...editorRenderProps} />
  }, [])

  const _renderStyle = useCallback((editorRenderProps: BlockStyleRenderProps) => {
    return <Style {...editorRenderProps} />
  }, [])

  const _renderAnnotation = useCallback(
    (editorRenderProps: BlockAnnotationRenderProps) => {
      return (
        <Annotation
          floatingBoundary={editorRenderProps.editorElementRef.current}
          editorNodeFocused={editorFocused}
          focused={editorRenderProps.focused}
          // eslint-disable-next-line react/jsx-handler-names
          onItemClose={formProps.onItemClose}
          // eslint-disable-next-line react/jsx-handler-names
          onItemOpen={formProps.onItemOpen}
          // eslint-disable-next-line react/jsx-handler-names
          onPathFocus={formProps.onPathFocus}
          path={formProps.path.concat(editorRenderProps.path)}
          referenceBoundary={rootElementRef.current}
          renderAnnotation={formProps.renderAnnotation}
          renderField={formProps.renderField}
          renderInput={formProps.renderInput}
          renderItem={formProps.renderItem}
          renderPreview={formProps.renderPreview}
          selected={editorRenderProps.selected}
          schemaType={editorRenderProps.schemaType}
          value={editorRenderProps.value}
        >
          {editorRenderProps.children}
        </Annotation>
      )
    },
    [
      editorFocused,
      formProps.onItemClose,
      formProps.onItemOpen,
      formProps.onPathFocus,
      formProps.path,
      formProps.renderAnnotation,
      formProps.renderField,
      formProps.renderInput,
      formProps.renderItem,
      formProps.renderPreview,
    ],
  )

  const _renderChild = useCallback(
    (editorRenderProps: BlockChildRenderProps) => {
      const {
        children,
        focused: childFocused,
        path: childPath,
        selected,
        schemaType: childSchemaType,
        value: child,
      } = editorRenderProps
      const isSpan = child._type === editor.schemaTypes.span.name
      if (isSpan) {
        return children
      }
      return (
        <InlineObject
          floatingBoundary={editorRenderProps.editorElementRef.current}
          focused={childFocused}
          // eslint-disable-next-line react/jsx-handler-names
          onItemClose={formProps.onItemClose}
          // eslint-disable-next-line react/jsx-handler-names
          onItemOpen={formProps.onItemOpen}
          // eslint-disable-next-line react/jsx-handler-names
          onPathFocus={formProps.onPathFocus}
          path={formProps.path.concat(childPath)}
          readOnly={formProps.readOnly}
          referenceBoundary={rootElementRef.current}
          relativePath={childPath}
          renderAnnotation={formProps.renderAnnotation}
          renderBlock={formProps.renderBlock}
          renderField={formProps.renderField}
          renderInlineBlock={formProps.renderInlineBlock}
          renderInput={formProps.renderInput}
          renderItem={formProps.renderItem}
          renderPreview={formProps.renderPreview}
          schemaType={childSchemaType}
          selected={selected}
          value={child}
        />
      )
    },
    [
      editor.schemaTypes.span.name,
      formProps.onItemClose,
      formProps.onItemOpen,
      formProps.onPathFocus,
      formProps.path,
      formProps.readOnly,
      formProps.renderAnnotation,
      formProps.renderBlock,
      formProps.renderField,
      formProps.renderInlineBlock,
      formProps.renderInput,
      formProps.renderItem,
      formProps.renderPreview,
    ],
  )

  return (
    <EditableWrapStack ref={rootElementRef} data-ui="EditableWrapStack">
      <BoundaryElementProvider element={rootElementRef.current}>
        <PortableTextEditable
          onBeforeInput={onEditorBeforeInput}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyDown={handleKeyDown}
          ref={editableRef}
          renderBlock={_renderBlock}
          renderDecorator={_renderDecorator}
          renderChild={_renderChild}
          renderAnnotation={_renderAnnotation}
          renderStyle={_renderStyle}
          rangeDecorations={rangeDecorations}
          renderPlaceholder={renderPlaceholder}
          style={INLINE_STYLE}
        />
      </BoundaryElementProvider>
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
