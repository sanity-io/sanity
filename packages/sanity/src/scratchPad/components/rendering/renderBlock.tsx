import {BlockRenderProps} from '@sanity/portable-text-editor'
import React from 'react'
import {PortableTextTextBlock} from '@sanity/types'
import {TextBlock as InputsTextBlock} from '../../../core/form/inputs/PortableText/text/TextBlock'
import {PortableTextInputProps} from '../../../core'

interface EditorRenderBlockProps {
  blockProps: BlockRenderProps
  formProps: PortableTextInputProps
  boundaryElement: HTMLElement
  scrollElement: HTMLElement
}

export const TextBlock = (props: EditorRenderBlockProps) => {
  const {
    children,
    focused: blockFocused,
    path: blockPath,
    schemaType: blockSchemaType,
    selected,
    value: block,
  } = props.blockProps
  const {
    onItemClose,
    onItemOpen,
    onItemRemove,
    onPathFocus,
    path,
    readOnly,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
  } = props.formProps
  const {boundaryElement, scrollElement} = props
  return (
    <InputsTextBlock
      floatingBoundary={boundaryElement}
      focused={blockFocused}
      isFullscreen={false}
      onItemClose={onItemClose}
      onItemOpen={onItemOpen}
      onItemRemove={onItemRemove}
      onPathFocus={onPathFocus}
      path={path.concat(blockPath)}
      readOnly={readOnly}
      referenceBoundary={scrollElement}
      renderAnnotation={renderAnnotation}
      renderBlock={renderBlock}
      renderField={renderField}
      renderInlineBlock={renderInlineBlock}
      renderInput={renderInput}
      renderItem={renderItem}
      renderPreview={renderPreview}
      schemaType={blockSchemaType}
      selected={selected}
      value={block as PortableTextTextBlock}
    >
      {children}
    </InputsTextBlock>
  )
}
