import React, {ReactElement, FunctionComponent, useRef} from 'react'
import {Element as SlateElement, Editor, Range} from 'slate'
import {Path} from '@sanity/types'
import {useSelected, useEditor, ReactEditor} from '@sanity/slate-react'
import {PortableTextBlock, PortableTextFeatures} from '../types/portableText'
import {RenderAttributes, RenderBlockFunction, RenderChildFunction} from '../types/editor'
import {fromSlateValue} from '../utils/values'
import {debugWithName} from '../utils/debug'
import {KEY_TO_VALUE_ELEMENT} from '../utils/weakMaps'
import TextBlock from './nodes/TextBlock'
import Object from './nodes/DefaultObject'
import {DefaultBlockObject} from './nodes/index'
import {DraggableBlock} from './DraggableBlock'
import {DraggableChild} from './DraggableChild'

const debug = debugWithName('components:Element')
const debugRenders = false

type ElementProps = {
  attributes: string
  children: ReactElement
  element: SlateElement
  keyGenerator: () => string
  portableTextFeatures: PortableTextFeatures
  readOnly: boolean
  renderBlock?: RenderBlockFunction
  renderChild?: RenderChildFunction
}

const inlineBlockStyle = {display: 'inline-block'}

const defaultRender = (value: PortableTextBlock) => {
  return <Object value={value} />
}

export const Element: FunctionComponent<ElementProps> = ({
  attributes,
  children,
  element,
  keyGenerator,
  portableTextFeatures,
  readOnly,
  renderBlock,
  renderChild,
}) => {
  const editor = useEditor()
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
    if (block && typeof block._key === 'string') {
      const elmPath: Path = [{_key: block._key}, 'children', {_key: element._key}]
      if (debugRenders) {
        debug(`Render ${element._key} (inline object)`)
      }
      return (
        <span {...attributes} style={inlineBlockStyle}>
          <DraggableChild
            element={element}
            readOnly={readOnly}
            spanType={portableTextFeatures.types.span.name}
            keyGenerator={keyGenerator}
          >
            <span
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
              {children}
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
    if (debugRenders) {
      debug(`Render ${element._key} (text block)`)
    }
    if (typeof element.style === 'string') {
      renderAttribs.style = (element.style as string) || 'normal'
    }
    if (element.listItem) {
      renderAttribs.listItem = element.listItem as string
    }
    if (element.listItem && Number.isInteger(element.level)) {
      renderAttribs.level = element.level as number
    }
    const textBlock = (
      <TextBlock element={element} portableTextFeatures={portableTextFeatures}>
        {children}
      </TextBlock>
    )
    const renderedBlock = renderBlock
      ? renderBlock(
          fromSlateValue([element], element._type, KEY_TO_VALUE_ELEMENT.get(editor))[0],
          portableTextFeatures.types.block,
          renderAttribs,
          () => textBlock,
          blockRef
        )
      : textBlock
    className = `pt-block pt-text-block pt-text-block-style-${element.style}`
    if (element.listItem) {
      className += ` pt-list-item pt-list-item-${element.listItem} pt-list-item-level-${element.level}`
    }
    return (
      <div {...attributes} key={element._key} className={className}>
        <DraggableBlock element={element} readOnly={readOnly} blockRef={blockRef}>
          <div ref={blockRef}>{renderedBlock}</div>
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
    <div {...attributes} key={element._key} className={className}>
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
        {children}
      </DraggableBlock>
    </div>
  )
}
