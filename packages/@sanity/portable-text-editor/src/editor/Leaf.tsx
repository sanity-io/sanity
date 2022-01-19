import React, {ReactElement, SyntheticEvent, useCallback} from 'react'
import {Element, Range, Text} from 'slate'
import {useSelected, useSlateStatic} from '@sanity/slate-react'
import {uniq} from 'lodash'
import {PortableTextBlock, PortableTextFeatures, TextBlock} from '../types/portableText'
import {
  RenderChildFunction,
  RenderDecoratorFunction,
  RenderAnnotationFunction,
} from '../types/editor'
import {debugWithName} from '../utils/debug'
import {DefaultAnnotation} from './nodes/DefaultAnnotation'
import {DraggableChild} from './DraggableChild'

const debug = debugWithName('components:Leaf')
const debugRenders = false

type LeafProps = {
  attributes: string
  children: ReactElement
  keyGenerator: () => string
  leaf: Element
  portableTextFeatures: PortableTextFeatures
  renderAnnotation?: RenderAnnotationFunction
  renderChild?: RenderChildFunction
  renderDecorator?: RenderDecoratorFunction
  readOnly: boolean
}

export const Leaf = (props: LeafProps) => {
  const editor = useSlateStatic()
  const selected = useSelected()
  const {
    attributes,
    children,
    leaf,
    portableTextFeatures,
    keyGenerator,
    renderChild,
    readOnly,
  } = props
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
  if (Text.isText(leaf) && leaf._type === portableTextFeatures.types.span.name) {
    const blockElement = children.props.parent as TextBlock | undefined
    const path = blockElement ? [{_key: blockElement._key}, 'children', {_key: leaf._key}] : []
    const decoratorValues = portableTextFeatures.decorators.map((dec) => dec.value)
    const marks: string[] = uniq(
      (Array.isArray(leaf.marks) ? leaf.marks : []).filter((mark) => decoratorValues.includes(mark))
    )
    marks.forEach((mark) => {
      const type = portableTextFeatures.decorators.find((dec) => dec.value === mark)
      if (type) {
        // TODO: look into this API!
        if (type?.blockEditor?.render) {
          const CustomComponent = type?.blockEditor?.render
          returnedChildren = <CustomComponent mark={mark}>{returnedChildren}</CustomComponent>
        }
        if (props.renderDecorator) {
          returnedChildren = props.renderDecorator(
            mark,
            type,
            {focused, selected, path},
            () => <>{returnedChildren}</>,
            spanRef
          )
        }
      }
    })
    const annotationMarks = Array.isArray(leaf.marks) ? leaf.marks : []
    const annotations = annotationMarks
      .map(
        (mark) =>
          !decoratorValues.includes(mark) &&
          blockElement &&
          blockElement.markDefs &&
          (blockElement.markDefs.find((def) => def._key === mark) as PortableTextBlock | undefined)
      )
      .filter(Boolean) as PortableTextBlock[]

    if (annotations.length > 0) {
      annotations.forEach((annotation) => {
        const type = portableTextFeatures.types.annotations.find((t) => t.name === annotation._type)
        // TODO: look into this API!
        const CustomComponent = type?.blockEditor?.render
        const defaultRender = (): JSX.Element =>
          // TODO: annotation should be an own prop here, keeping for backward compability (2020/05/18).
          CustomComponent ? (
            <CustomComponent {...annotation} attributes={attributes}>
              {returnedChildren}
            </CustomComponent>
          ) : (
            <>{returnedChildren}</>
          )

        if (type) {
          if (props.renderAnnotation) {
            returnedChildren = (
              <span ref={spanRef} key={keyGenerator()}>
                {props.renderAnnotation(
                  annotation,
                  type,
                  {focused, selected, path, annotations},
                  defaultRender,
                  spanRef
                )}
              </span>
            )
          } else {
            returnedChildren = (
              <DefaultAnnotation annotation={annotation}>
                <span ref={spanRef} key={keyGenerator()} onMouseDown={handleMouseDown}>
                  {defaultRender()}
                </span>
              </DefaultAnnotation>
            )
          }
        }
      })
    }
    if (blockElement && renderChild) {
      const child = blockElement.children.find((_child) => _child._key === leaf._key) // Ensure object equality
      if (child) {
        returnedChildren = renderChild(
          child,
          portableTextFeatures.types.span,
          {focused, selected, path, annotations},
          () => returnedChildren,
          spanRef
        )
      }
    }
  }
  if (debugRenders) {
    debug(`Render ${leaf._key} (span)`)
  }
  const key = leaf._key || keyGenerator()

  return (
    <span {...attributes} ref={spanRef} key={key}>
      <DraggableChild element={leaf} readOnly={readOnly}>
        {returnedChildren}
      </DraggableChild>
    </span>
  )
}
