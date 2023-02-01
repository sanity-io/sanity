import React, {ReactElement} from 'react'
import {Range, Text} from 'slate'
import {RenderLeafProps, useSelected, useSlateStatic} from '@sanity/slate-react'
import {uniq} from 'lodash'
import {PortableTextObject, PortableTextTextBlock} from '@sanity/types'
import {
  RenderChildFunction,
  PortableTextMemberSchemaTypes,
  RenderAnnotationFunction,
  RenderDecoratorFunction,
} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {DefaultAnnotation} from '../nodes/DefaultAnnotation'
import {DraggableChild} from './DraggableChild'

const debug = debugWithName('components:Leaf')
const debugRenders = false

/**
 * @internal
 */
export interface LeafProps extends RenderLeafProps {
  children: ReactElement
  keyGenerator: () => string
  schemaTypes: PortableTextMemberSchemaTypes
  renderAnnotation?: RenderAnnotationFunction
  renderChild?: RenderChildFunction
  renderDecorator?: RenderDecoratorFunction
  readOnly: boolean
}

/**
 * Renders Portable Text span nodes in Slate
 * @internal
 */
export const Leaf = (props: LeafProps) => {
  const editor = useSlateStatic()
  const selected = useSelected()
  const {attributes, children, leaf, schemaTypes, keyGenerator, renderChild, readOnly} = props
  const spanRef = React.useRef(null)
  let returnedChildren = children
  const focused = (selected && editor.selection && Range.isCollapsed(editor.selection)) || false

  // Render text nodes
  if (Text.isText(leaf) && leaf._type === schemaTypes.span.name) {
    const block = children.props.parent as PortableTextTextBlock | undefined
    const path = block ? [{_key: block._key}, 'children', {_key: leaf._key}] : []
    const decoratorValues = schemaTypes.decorators.map((dec) => dec.value)
    const marks: string[] = uniq(
      (Array.isArray(leaf.marks) ? leaf.marks : []).filter((mark) => decoratorValues.includes(mark))
    )
    marks.forEach((mark) => {
      const type = schemaTypes.decorators.find((dec) => dec.value === mark)
      if (type && props.renderDecorator) {
        returnedChildren = props.renderDecorator({
          children: returnedChildren,
          editorElementRef: spanRef,
          focused,
          path,
          selected,
          type,
          value: mark,
        })
      }
    })
    const annotationMarks = Array.isArray(leaf.marks) ? leaf.marks : []
    const annotations = annotationMarks
      .map(
        (mark) =>
          !decoratorValues.includes(mark) &&
          block &&
          block.markDefs &&
          block.markDefs.find((def) => def._key === mark)
      )
      .filter(Boolean) as PortableTextObject[]

    if (block && annotations.length > 0) {
      annotations.forEach((annotation) => {
        const type = schemaTypes.annotations.find((t) => t.name === annotation._type)
        if (type) {
          if (props.renderAnnotation) {
            returnedChildren = (
              <span ref={spanRef}>
                {props.renderAnnotation({
                  block,
                  children: returnedChildren,
                  editorElementRef: spanRef,
                  focused,
                  path,
                  selected,
                  type,
                  value: annotation,
                })}
              </span>
            )
          } else {
            returnedChildren = (
              <DefaultAnnotation annotation={annotation}>
                <span ref={spanRef}>{returnedChildren}</span>
              </DefaultAnnotation>
            )
          }
        }
      })
    }
    if (block && renderChild) {
      const child = block.children.find((_child) => _child._key === leaf._key) // Ensure object equality
      if (child) {
        const defaultRendered = <>{returnedChildren}</>
        returnedChildren = renderChild({
          annotations,
          children: defaultRendered,
          editorElementRef: spanRef,
          focused,
          path,
          schemaType: schemaTypes.span,
          selected,
          value: child,
        })
      }
    }
  }
  if (debugRenders) {
    debug(`Render ${leaf._key} (span)`)
  }
  const key = leaf._key || keyGenerator()

  return (
    <span key={key} {...attributes} ref={spanRef}>
      <DraggableChild element={leaf} readOnly={readOnly}>
        {returnedChildren}
      </DraggableChild>
    </span>
  )
}
