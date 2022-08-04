import React, {ReactElement, FunctionComponent, useRef} from 'react'
import {Element as SlateElement, Editor, Range} from 'slate'
import {Path} from '@sanity/types'
import {useSelected, useSlateStatic, ReactEditor} from '@sanity/slate-react'
import {PortableTextBlock, PortableTextFeatures} from '../types/portableText'
import {RenderAttributes, RenderBlockFunction, RenderChildFunction} from '../types/editor'
import {fromSlateValue} from '../utils/values'
import {debugWithName} from '../utils/debug'
import {KEY_TO_VALUE_ELEMENT} from '../utils/weakMaps'
import TextBlock from './nodes/TextBlock'
import ObjectNode from './nodes/DefaultObject'
import {DefaultBlockObject} from './nodes/index'
import {DraggableBlock} from './DraggableBlock'
import {DraggableChild} from './DraggableChild'

const debug = debugWithName('components:Element')
const debugRenders = false

export interface ElementAttributes {
  'data-slate-node': 'element'
  'data-slate-void'?: true
  'data-slate-inline'?: true
  contentEditable?: false
  dir?: 'rtl'
  ref: any
}

type ElementProps = {
  attributes: ElementAttributes
  children: ReactElement
  element: SlateElement
  portableTextFeatures: PortableTextFeatures
  readOnly: boolean
  renderBlock?: RenderBlockFunction
  renderChild?: RenderChildFunction
  spellCheck?: boolean
}

const inlineBlockStyle = {display: 'inline-block'}

const defaultRender = (value: PortableTextBlock) => {
  return <ObjectNode value={value} />
}

// eslint-disable-next-line max-statements
export const Element: FunctionComponent<ElementProps> = ({
  attributes,
  children,
  element,
  portableTextFeatures,
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
  let className

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
    const type = portableTextFeatures.types.inlineObjects.find(
      (_type) => _type.name === element._type
    )
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
                renderChild(
                  fromSlateValue(
                    [element],
                    portableTextFeatures.types.block.name,
                    KEY_TO_VALUE_ELEMENT.get(editor)
                  )[0],
                  type,
                  {focused, selected, path: elmPath},
                  defaultRender,
                  inlineBlockObjectRef
                )}
              {!renderChild &&
                defaultRender(
                  fromSlateValue(
                    [element],
                    portableTextFeatures.types.block.name,
                    KEY_TO_VALUE_ELEMENT.get(editor)
                  )[0]
                )}
            </span>
          </DraggableChild>
        </span>
      )
    }
    throw new Error('Block not found!')
  }

  const renderAttribs: RenderAttributes = {focused, selected, path: [{_key: element._key}]}

  // If not inline, it's either a block (text) or a block object (non-text)
  // NOTE: text blocks aren't draggable with DraggableBlock (yet?)
  if (element._type === portableTextFeatures.types.block.name) {
    className = `pt-block pt-text-block`
    const isListItem = 'listItem' in element
    const hasStyle = 'style' in element
    if (debugRenders) {
      debug(`Render ${element._key} (text block)`)
    }
    if (hasStyle) {
      renderAttribs.style = element.style || 'normal'
      className = `pt-block pt-text-block pt-text-block-style-${element.style}`
    }
    if (isListItem) {
      renderAttribs.listItem = element.listItem
      if (Number.isInteger(element.level)) {
        renderAttribs.level = element.level
      } else {
        renderAttribs.level = 1
      }
      className += ` pt-list-item pt-list-item-${renderAttribs.listItem} pt-list-item-level-${renderAttribs.level}`
    }
    const textBlock = (
      <TextBlock block={element} portableTextFeatures={portableTextFeatures}>
        {children}
      </TextBlock>
    )
    const propsOrDefaultRendered = renderBlock
      ? renderBlock(
          fromSlateValue([element], element._type, KEY_TO_VALUE_ELEMENT.get(editor))[0],
          portableTextFeatures.types.block,
          renderAttribs,
          () => textBlock,
          blockRef
        )
      : textBlock
    return (
      <div key={element._key} {...attributes} className={className} spellCheck={spellCheck}>
        <DraggableBlock element={element} readOnly={readOnly} blockRef={blockRef}>
          <div ref={blockRef}>{propsOrDefaultRendered}</div>
        </DraggableBlock>
      </div>
    )
  }
  const type = portableTextFeatures.types.blockObjects.find((_type) => _type.name === element._type)
  if (!type) {
    throw new Error(`Could not find schema type for block element of _type ${element._type}`)
  }
  if (debugRenders) {
    debug(`Render ${element._key} (object block)`)
  }
  className = 'pt-block pt-object-block'
  const block = fromSlateValue(
    [element],
    portableTextFeatures.types.block.name,
    KEY_TO_VALUE_ELEMENT.get(editor)
  )[0]
  const renderedBlockFromProps =
    renderBlock && renderBlock(block, type, renderAttribs, defaultRender, blockRef)
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
            {defaultRender(
              fromSlateValue(
                [element],
                portableTextFeatures.types.block.name,
                KEY_TO_VALUE_ELEMENT.get(editor)
              )[0]
            )}
          </DefaultBlockObject>
        )}
      </DraggableBlock>
    </div>
  )
}
