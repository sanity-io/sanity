import React, {
  ReactElement,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {Text} from 'slate'
import {RenderLeafProps, useSelected} from 'slate-react'
import {isEqual, uniq} from 'lodash'
import {Path, PortableTextObject, PortableTextTextBlock} from '@sanity/types'
import {
  RenderChildFunction,
  PortableTextMemberSchemaTypes,
  RenderAnnotationFunction,
  RenderDecoratorFunction,
  BlockDecoratorRenderProps,
  BlockAnnotationRenderProps,
  BlockChildRenderProps,
} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {DefaultAnnotation} from '../nodes/DefaultAnnotation'
import {usePortableTextEditor} from '../hooks/usePortableTextEditor'
import {PortableTextEditor} from '../PortableTextEditor'

const debug = debugWithName('components:Leaf')

const EMPTY_MARKS: string[] = []

/**
 * @internal
 */
export interface LeafProps extends RenderLeafProps {
  children: ReactElement
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
  const {attributes, children, leaf, schemaTypes, renderChild, renderDecorator, renderAnnotation} =
    props
  const spanRef = React.useRef<HTMLElement>(null)
  const portableTextEditor = usePortableTextEditor()
  const blockSelected = useSelected()
  const [focused, setFocused] = useState(false)
  const [selected, setSelected] = useState(false)
  const block = children.props.parent as PortableTextTextBlock | undefined
  const path: Path = useMemo(
    () => (block ? [{_key: block?._key}, 'children', {_key: leaf._key}] : []),
    [block, leaf._key]
  )
  const decoratorValues = useMemo(
    () => schemaTypes.decorators.map((dec) => dec.value),
    [schemaTypes.decorators]
  )
  const marks: string[] = useMemo(
    () => uniq((leaf.marks || EMPTY_MARKS).filter((mark) => decoratorValues.includes(mark))),
    [decoratorValues, leaf.marks]
  )
  const annotationMarks = Array.isArray(leaf.marks) ? leaf.marks : EMPTY_MARKS
  const annotations = useMemo(
    () =>
      annotationMarks
        .map(
          (mark) =>
            !decoratorValues.includes(mark) && block?.markDefs?.find((def) => def._key === mark)
        )
        .filter(Boolean) as PortableTextObject[],
    [annotationMarks, block, decoratorValues]
  )

  const shouldTrackSelectionAndFocus = annotations.length > 0 && blockSelected

  useEffect(() => {
    if (!shouldTrackSelectionAndFocus) {
      setFocused(false)
      return
    }
    const sel = PortableTextEditor.getSelection(portableTextEditor)
    if (
      sel &&
      isEqual(sel.focus.path, path) &&
      PortableTextEditor.isCollapsedSelection(portableTextEditor)
    ) {
      startTransition(() => {
        setFocused(true)
      })
    }
  }, [shouldTrackSelectionAndFocus, path, portableTextEditor])

  // Function to check if this leaf is currently inside the user's text selection
  const setSelectedFromRange = useCallback(() => {
    if (!shouldTrackSelectionAndFocus) {
      return
    }
    debug('Setting selection and focus from range')
    const winSelection = window.getSelection()
    if (!winSelection) {
      setSelected(false)
      return
    }
    if (winSelection && winSelection.rangeCount > 0) {
      const range = winSelection.getRangeAt(0)
      if (spanRef.current && range.intersectsNode(spanRef.current)) {
        setSelected(true)
      } else {
        setSelected(false)
      }
    } else {
      setSelected(false)
    }
  }, [shouldTrackSelectionAndFocus])

  useEffect(() => {
    if (!shouldTrackSelectionAndFocus) {
      return undefined
    }
    const sub = portableTextEditor.change$.subscribe((next) => {
      if (next.type === 'blur') {
        setFocused(false)
        setSelected(false)
        return
      }
      if (next.type === 'focus') {
        const sel = PortableTextEditor.getSelection(portableTextEditor)
        if (
          sel &&
          isEqual(sel.focus.path, path) &&
          PortableTextEditor.isCollapsedSelection(portableTextEditor)
        ) {
          setFocused(true)
        }
        setSelectedFromRange()
        return
      }
      if (next.type === 'selection') {
        if (
          next.selection &&
          isEqual(next.selection.focus.path, path) &&
          PortableTextEditor.isCollapsedSelection(portableTextEditor)
        ) {
          setFocused(true)
        } else {
          setFocused(false)
        }
        setSelectedFromRange()
      }
    })
    return () => {
      sub.unsubscribe()
    }
  }, [path, portableTextEditor, setSelectedFromRange, shouldTrackSelectionAndFocus])

  useEffect(() => setSelectedFromRange(), [setSelectedFromRange])

  const content = useMemo(() => {
    let returnedChildren = children
    // Render text nodes
    if (Text.isText(leaf) && leaf._type === schemaTypes.span.name) {
      marks.forEach((mark) => {
        const schemaType = schemaTypes.decorators.find((dec) => dec.value === mark)
        if (schemaType && renderDecorator) {
          const _props: Omit<BlockDecoratorRenderProps, 'type'> = Object.defineProperty(
            {
              children: returnedChildren,
              editorElementRef: spanRef,
              focused,
              path,
              selected,
              schemaType,
              value: mark,
            },
            'type',
            {
              enumerable: false,
              get() {
                console.warn("Property 'type' is deprecated, use 'schemaType' instead.")
                return schemaType
              },
            }
          )
          returnedChildren = renderDecorator(_props as BlockDecoratorRenderProps)
        }
      })

      if (block && annotations.length > 0) {
        annotations.forEach((annotation) => {
          const schemaType = schemaTypes.annotations.find((t) => t.name === annotation._type)
          if (schemaType) {
            if (renderAnnotation) {
              const _props: Omit<BlockAnnotationRenderProps, 'type'> = Object.defineProperty(
                {
                  block,
                  children: returnedChildren,
                  editorElementRef: spanRef,
                  focused,
                  path,
                  selected,
                  schemaType,
                  value: annotation,
                },
                'type',
                {
                  enumerable: false,
                  get() {
                    console.warn("Property 'type' is deprecated, use 'schemaType' instead.")
                    return schemaType
                  },
                }
              )

              returnedChildren = (
                <span ref={spanRef}>{renderAnnotation(_props as BlockAnnotationRenderProps)}</span>
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
          const _props: Omit<BlockChildRenderProps, 'type'> = Object.defineProperty(
            {
              annotations,
              children: defaultRendered,
              editorElementRef: spanRef,
              focused,
              path,
              schemaType: schemaTypes.span,
              selected,
              value: child,
            },
            'type',
            {
              enumerable: false,
              get() {
                console.warn("Property 'type' is deprecated, use 'schemaType' instead.")
                return schemaTypes.span
              },
            }
          )
          returnedChildren = renderChild(_props as BlockChildRenderProps)
        }
      }
    }
    return returnedChildren
  }, [
    annotations,
    block,
    children,
    focused,
    leaf,
    marks,
    path,
    renderAnnotation,
    renderChild,
    renderDecorator,
    schemaTypes.annotations,
    schemaTypes.decorators,
    schemaTypes.span,
    selected,
  ])
  return useMemo(
    () => (
      <span key={leaf._key} {...attributes} ref={spanRef}>
        {content}
      </span>
    ),
    [leaf, attributes, content]
  )
}
