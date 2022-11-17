import React, {ReactElement, FunctionComponent, useRef, useMemo, useCallback} from 'react'
import {Element as SlateElement, Editor, Range} from 'slate'
import {BlockRenderProps, Path, PortableTextChild, PortableTextObject} from '@sanity/types'
import {useSelected, useSlateStatic, ReactEditor, RenderElementProps} from '@sanity/slate-react'
import {PortableTextMemberTypes, RenderBlockFunction, RenderChildFunction} from '../types/editor'
import {fromSlateValue} from '../utils/values'
import {debugWithName} from '../utils/debug'
import {KEY_TO_VALUE_ELEMENT} from '../utils/weakMaps'
import ObjectNode from './nodes/DefaultObject'
import {DefaultBlockObject, DefaultListItem, DefaultListItemInner} from './nodes/index'
import {DraggableBlock} from './DraggableBlock'
import {DraggableChild} from './DraggableChild'

const debug = debugWithName('components:Element')
const debugRenders = false
const EMPTY_ANNOTATIONS: PortableTextObject[] = []
interface ElementProps {
  attributes: RenderElementProps['attributes']
  children: ReactElement
  element: SlateElement
  types: PortableTextMemberTypes
  readOnly: boolean
  renderBlock?: RenderBlockFunction
  renderChild?: RenderChildFunction
  spellCheck?: boolean
}

const inlineBlockStyle = {display: 'inline-block'}

// eslint-disable-next-line max-statements, complexity
export const Element: FunctionComponent<ElementProps> = ({
  attributes,
  children,
  element,
  types,
  readOnly,
  renderBlock,
  renderChild,
  spellCheck,
}) => {
  const editor = useSlateStatic()
  const selected = useSelected()
  const blockRef = useRef<HTMLDivElement | null>(null)
  const inlineBlockObjectRef = useRef(null)
  const focused = (selected && editor.selection && Range.isCollapsed(editor.selection)) || false

  const value = useMemo(
    () => fromSlateValue([element], types.block.name, KEY_TO_VALUE_ELEMENT.get(editor))[0],
    [editor, element, types.block.name]
  )

  let renderedBlock = children

  const renderDefault = useCallback(() => children, [children])

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
    const type = types.inlineObjects.find((_type) => _type.name === element._type)
    if (!type) {
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
          <DraggableChild element={element} readOnly={readOnly}>
            <span
              className="pt-inline-object"
              ref={inlineBlockObjectRef}
              key={element._key}
              style={inlineBlockStyle}
              contentEditable={false}
            >
              {renderChild &&
                renderChild({
                  annotations: EMPTY_ANNOTATIONS, // These inline objects currently doesn't support annotations. This is a limitation of the current PT spec/model.
                  value: value as PortableTextChild,
                  type,
                  focused,
                  selected,
                  path: elmPath,
                  renderDefault: (props) => <ObjectNode value={props.value} />,
                  editorElementRef: inlineBlockObjectRef,
                })}
              {!renderChild && <ObjectNode value={value} />}
            </span>
          </DraggableChild>
        </span>
      )
    }
    throw new Error('Block not found!')
  }

  // If not inline, it's either a block (text) or a block object (non-text)
  // NOTE: text blocks aren't draggable with DraggableBlock (yet?)
  if (element._type === types.block.name) {
    className = `pt-block pt-text-block`
    const isListItem = 'listItem' in element
    const hasStyle = 'style' in element
    if (debugRenders) {
      debug(`Render ${element._key} (text block)`)
    }
    if (hasStyle) {
      const style = element.style || 'normal'
      className = `pt-block pt-text-block pt-text-block-style-${element.style}`
      const blockStyle = types.styles.find((item) => item.value === style)
      const CustomStyle = blockStyle?.components?.item
      if (CustomStyle && blockStyle) {
        renderedBlock = (
          <CustomStyle
            focused={focused}
            selected={selected}
            value={style}
            path={blockPath}
            type={blockStyle}
            editorElementRef={blockRef}
            renderDefault={renderDefault}
          />
        )
      }
    }
    let level
    if (isListItem) {
      if (typeof element.level === 'number') {
        level = element.level
      }
      className += ` pt-list-item pt-list-item-${element.listItem} pt-list-item-level-${level || 1}`
    }
    if (editor.isListBlock(value)) {
      renderedBlock = (
        <DefaultListItem
          listStyle={value.listItem || types.lists[0].value}
          listLevel={value.level || 0}
        >
          <DefaultListItemInner>{renderedBlock}</DefaultListItemInner>
        </DefaultListItem>
      )
    }
    const renderProps: BlockRenderProps = {
      value,
      type: types.block,
      focused,
      path: blockPath,
      selected,
      renderDefault: () => renderedBlock,
      editorElementRef: blockRef,
      style: hasStyle ? element.style : 'normal',
      listItem: isListItem ? element.listItem : undefined,
      level,
    }

    const propsOrDefaultRendered = renderBlock ? renderBlock(renderProps) : children
    return (
      <div key={element._key} {...attributes} className={className} spellCheck={spellCheck}>
        <DraggableBlock element={element} readOnly={readOnly} blockRef={blockRef}>
          <div ref={blockRef}>{propsOrDefaultRendered}</div>
        </DraggableBlock>
      </div>
    )
  }
  const type = types.blockObjects.find((_type) => _type.name === element._type)
  if (!type) {
    throw new Error(`Could not find schema type for block element of _type ${element._type}`)
  }
  if (debugRenders) {
    debug(`Render ${element._key} (object block)`)
  }
  className = 'pt-block pt-object-block'
  const block = fromSlateValue([element], types.block.name, KEY_TO_VALUE_ELEMENT.get(editor))[0]
  const renderedBlockFromProps =
    renderBlock &&
    renderBlock({
      value: block,
      type,
      selected,
      focused,
      path: blockPath,
      renderDefault: (props) => <ObjectNode value={props.value} />,
      editorElementRef: blockRef,
    })
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
