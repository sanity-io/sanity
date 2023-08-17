/* eslint-disable complexity */
/* eslint-disable max-statements */
import React, {ReactElement, FunctionComponent, useRef, useMemo} from 'react'
import {Element as SlateElement, Editor, Range} from 'slate'
import {Path, PortableTextChild, PortableTextObject, PortableTextTextBlock} from '@sanity/types'
import {useSelected, useSlateStatic, ReactEditor, RenderElementProps} from 'slate-react'
import {
  BlockRenderProps,
  PortableTextMemberSchemaTypes,
  RenderBlockFunction,
  RenderChildFunction,
  RenderListItemFunction,
  RenderStyleFunction,
} from '../../types/editor'
import {fromSlateValue} from '../../utils/values'
import {debugWithName} from '../../utils/debug'
import {KEY_TO_VALUE_ELEMENT} from '../../utils/weakMaps'
import ObjectNode from '../nodes/DefaultObject'
import {DefaultBlockObject, DefaultListItem, DefaultListItemInner} from '../nodes/index'
import {DraggableBlock} from './DraggableBlock'

const debug = debugWithName('components:Element')
const debugRenders = false
const EMPTY_ANNOTATIONS: PortableTextObject[] = []

/**
 * @internal
 */
export interface ElementProps {
  attributes: RenderElementProps['attributes']
  children: ReactElement
  element: SlateElement
  schemaTypes: PortableTextMemberSchemaTypes
  readOnly: boolean
  renderBlock?: RenderBlockFunction
  renderChild?: RenderChildFunction
  renderListItem?: RenderListItemFunction
  renderStyle?: RenderStyleFunction
  spellCheck?: boolean
}

const inlineBlockStyle = {display: 'inline-block'}

/**
 * Renders Portable Text block and inline object nodes in Slate
 * @internal
 */
export const Element: FunctionComponent<ElementProps> = ({
  attributes,
  children,
  element,
  schemaTypes,
  readOnly,
  renderBlock,
  renderChild,
  renderListItem,
  renderStyle,
  spellCheck,
}) => {
  const editor = useSlateStatic()
  const selected = useSelected()
  const blockRef = useRef<HTMLDivElement | null>(null)
  const inlineBlockObjectRef = useRef(null)
  const focused = (selected && editor.selection && Range.isCollapsed(editor.selection)) || false

  const value = useMemo(
    () => fromSlateValue([element], schemaTypes.block.name, KEY_TO_VALUE_ELEMENT.get(editor))[0],
    [editor, element, schemaTypes.block.name],
  )

  let renderedBlock = children

  let className

  const blockPath: Path = useMemo(() => [{_key: element._key}], [element])

  if (typeof element._type !== 'string') {
    throw new Error(`Expected element to have a _type property`)
  }

  if (typeof element._key !== 'string') {
    throw new Error(`Expected element to have a _key property`)
  }

  // Test for inline objects first
  if (editor.isInline(element)) {
    const path = ReactEditor.findPath(editor, element)
    const [block] = Editor.node(editor, path, {depth: 1})
    const schemaType = schemaTypes.inlineObjects.find((_type) => _type.name === element._type)
    if (!schemaType) {
      throw new Error('Could not find type for inline block element')
    }
    if (SlateElement.isElement(block)) {
      const elmPath: Path = [{_key: block._key}, 'children', {_key: element._key}]
      if (debugRenders) {
        debug(`Render ${element._key} (inline object)`)
      }
      return (
        <span {...attributes}>
          {/* Note that children must follow immediately or cut and selections will not work properly in Chrome. */}
          {children}
          <span
            draggable={!readOnly}
            className="pt-inline-object"
            ref={inlineBlockObjectRef}
            key={element._key}
            style={inlineBlockStyle}
            contentEditable={false}
          >
            {renderChild &&
              renderChild({
                annotations: EMPTY_ANNOTATIONS, // These inline objects currently doesn't support annotations. This is a limitation of the current PT spec/model.
                children: <ObjectNode value={value} />,
                editorElementRef: inlineBlockObjectRef,
                focused,
                path: elmPath,
                schemaType,
                selected,
                type: schemaType,
                value: value as PortableTextChild,
              })}
            {!renderChild && <ObjectNode value={value} />}
          </span>
        </span>
      )
    }
    throw new Error('Block not found!')
  }

  // If not inline, it's either a block (text) or a block object (non-text)
  // NOTE: text blocks aren't draggable with DraggableBlock (yet?)
  if (element._type === schemaTypes.block.name) {
    className = `pt-block pt-text-block`
    const isListItem = 'listItem' in element
    if (debugRenders) {
      debug(`Render ${element._key} (text block)`)
    }
    const style = ('style' in element && element.style) || 'normal'
    className = `pt-block pt-text-block pt-text-block-style-${style}`
    const blockStyleType = schemaTypes.styles.find((item) => item.value === style)
    if (renderStyle && blockStyleType) {
      renderedBlock = renderStyle({
        block: element as PortableTextTextBlock,
        children,
        focused,
        selected,
        value: style,
        path: blockPath,
        schemaType: blockStyleType,
        editorElementRef: blockRef,
      })
    }
    let level
    if (isListItem) {
      if (typeof element.level === 'number') {
        level = element.level
      }
      className += ` pt-list-item pt-list-item-${element.listItem} pt-list-item-level-${level || 1}`
    }
    if (editor.isListBlock(value) && isListItem && element.listItem) {
      const listType = schemaTypes.lists.find((item) => item.value === element.listItem)
      if (renderListItem && listType) {
        renderedBlock = renderListItem({
          block: value,
          children: renderedBlock,
          focused,
          selected,
          value: element.listItem,
          path: blockPath,
          schemaType: listType,
          level: value.level || 1,
          editorElementRef: blockRef,
        })
      } else {
        renderedBlock = (
          <DefaultListItem
            listStyle={value.listItem || schemaTypes.lists[0].value}
            listLevel={value.level || 1}
          >
            <DefaultListItemInner>{renderedBlock}</DefaultListItemInner>
          </DefaultListItem>
        )
      }
    }
    const renderProps: Omit<BlockRenderProps, 'type'> = Object.defineProperty(
      {
        children: renderedBlock,
        editorElementRef: blockRef,
        focused,
        level,
        listItem: isListItem ? element.listItem : undefined,
        path: blockPath,
        selected,
        style,
        schemaType: schemaTypes.block,
        value,
      },
      'type',
      {
        enumerable: false,
        get() {
          console.warn("Property 'type' is deprecated, use 'schemaType' instead.")
          return schemaTypes.block
        },
      },
    )

    const propsOrDefaultRendered = renderBlock
      ? renderBlock(renderProps as BlockRenderProps)
      : children
    return (
      <div key={element._key} {...attributes} className={className} spellCheck={spellCheck}>
        <DraggableBlock element={element} readOnly={readOnly} blockRef={blockRef}>
          <div ref={blockRef}>{propsOrDefaultRendered}</div>
        </DraggableBlock>
      </div>
    )
  }
  const schemaType = schemaTypes.blockObjects.find((_type) => _type.name === element._type)
  if (!schemaType) {
    throw new Error(`Could not find schema type for block element of _type ${element._type}`)
  }
  if (debugRenders) {
    debug(`Render ${element._key} (object block)`)
  }
  className = 'pt-block pt-object-block'
  const block = fromSlateValue(
    [element],
    schemaTypes.block.name,
    KEY_TO_VALUE_ELEMENT.get(editor),
  )[0]
  let renderedBlockFromProps
  if (renderBlock) {
    const _props: Omit<BlockRenderProps, 'type'> = Object.defineProperty(
      {
        children: <ObjectNode value={value} />,
        editorElementRef: blockRef,
        focused,
        path: blockPath,
        schemaType,
        selected,
        value: block,
      },
      'type',
      {
        enumerable: false,
        get() {
          console.warn("Property 'type' is deprecated, use 'schemaType' instead.")
          return schemaType
        },
      },
    )
    renderedBlockFromProps = renderBlock(_props as BlockRenderProps)
  }
  return (
    <div key={element._key} {...attributes} className={className}>
      {children}
      <DraggableBlock element={element} readOnly={readOnly} blockRef={blockRef}>
        {renderedBlockFromProps && (
          <div ref={blockRef} contentEditable={false}>
            {renderedBlockFromProps}
          </div>
        )}
        {!renderedBlockFromProps && (
          <DefaultBlockObject selected={selected}>
            <ObjectNode value={value} />
          </DefaultBlockObject>
        )}
      </DraggableBlock>
    </div>
  )
}
