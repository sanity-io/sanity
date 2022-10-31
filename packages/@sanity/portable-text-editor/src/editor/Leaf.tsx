import React, {ReactElement, SyntheticEvent, useCallback} from 'react'
import {Range, Text} from 'slate'
import {RenderLeafProps, useSelected, useSlateStatic} from '@sanity/slate-react'
import {uniq} from 'lodash'
import {PortableTextObject, PortableTextTextBlock} from '@sanity/types'
import {
  RenderChildFunction,
  RenderDecoratorFunction,
  RenderAnnotationFunction,
  PortableTextMemberTypes,
} from '../types/editor'
import {debugWithName} from '../utils/debug'
import {DefaultAnnotation} from './nodes/DefaultAnnotation'
import {DraggableChild} from './DraggableChild'

const debug = debugWithName('components:Leaf')
const debugRenders = false

interface LeafProps extends RenderLeafProps {
  children: ReactElement
  keyGenerator: () => string
  types: PortableTextMemberTypes
  renderAnnotation?: RenderAnnotationFunction
  renderChild?: RenderChildFunction
  renderDecorator?: RenderDecoratorFunction
  readOnly: boolean
}

export const Leaf = (props: LeafProps) => {
  const editor = useSlateStatic()
  const selected = useSelected()
  const {attributes, children, leaf, types, keyGenerator, renderChild, readOnly} = props
  const spanRef = React.useRef(null)
  let returnedChildren = children
  const focused = (selected && editor.selection && Range.isCollapsed(editor.selection)) || false
  const handleMouseDown = useCallback(
    (event: SyntheticEvent) => {
      // Slate will deselect this when it is already selected and clicked again, so prevent that. 2020/05/04
      if (focused) {
        event.stopPropagation()
        event.preventDefault()
      }
    },
    [focused]
  )
  // Render text nodes
  if (Text.isText(leaf) && leaf._type === types.span.name) {
    const block = children.props.parent as PortableTextTextBlock | undefined
    const path = block ? [{_key: block._key}, 'children', {_key: leaf._key}] : []
    const decoratorValues = types.decorators.map((dec) => dec.value)
    const marks: string[] = uniq(
      (Array.isArray(leaf.marks) ? leaf.marks : []).filter((mark) => decoratorValues.includes(mark))
    )
    marks.forEach((mark) => {
      const type = types.decorators.find((dec) => dec.value === mark)
      if (type && props.renderDecorator) {
        returnedChildren = props.renderDecorator({
          value: mark,
          type,
          attributes: {focused, selected, path},
          defaultRender: () => returnedChildren,
          editorElementRef: spanRef,
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

    if (annotations.length > 0) {
      const aAttributes = {focused, selected, path, annotations}
      annotations.forEach((annotation) => {
        const type = types.annotations.find((t) => t.name === annotation._type)
        if (type) {
          if (props.renderAnnotation) {
            returnedChildren = (
              <span ref={spanRef} key={keyGenerator()}>
                {props.renderAnnotation({
                  value: annotation,
                  type,
                  attributes: aAttributes,
                  defaultRender: () => <>{returnedChildren}</>,
                  editorElementRef: spanRef,
                })}
              </span>
            )
          } else {
            returnedChildren = (
              <DefaultAnnotation annotation={annotation}>
                <span ref={spanRef} key={keyGenerator()} onMouseDown={handleMouseDown}>
                  {returnedChildren}
                </span>
              </DefaultAnnotation>
            )
          }
        }
      })
    }
    if (block && renderChild) {
      const child = block.children.find((_child) => _child._key === leaf._key) // Ensure object equality
      if (child) {
        returnedChildren = renderChild({
          value: child,
          type: types.span,
          attributes: {focused, selected, path, annotations},
          defaultRender: () => returnedChildren,
          editorElementRef: spanRef,
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
