import {isEqual} from 'lodash'
import {Node, Element, Text, Descendant} from 'slate'
import {
  PathSegment,
  PortableTextBlock,
  PortableTextChild,
  PortableTextObject,
  PortableTextTextBlock,
} from '@sanity/types'
import {PortableTextMemberSchemaTypes} from '../types/editor'

const EMPTY_MARKDEFS: PortableTextObject[] = []

type Partial<T> = {
  [P in keyof T]?: T[P]
}

function keepObjectEquality(
  object: PortableTextBlock | PortableTextChild,
  keyMap: Record<string, PortableTextBlock | PortableTextChild>
) {
  const value = keyMap[object._key]
  if (value && isEqual(object, value)) {
    return value
  }
  keyMap[object._key] = object
  return object
}

export function toSlateValue(
  value: PortableTextBlock[] | undefined,
  {schemaTypes}: {schemaTypes: PortableTextMemberSchemaTypes},
  keyMap: Record<string, any> = {}
): Descendant[] {
  if (value && Array.isArray(value)) {
    return value.map((block) => {
      const {_type, _key, ...rest} = block
      const voidChildren = [{_key: `${_key}-void-child`, _type: 'span', text: '', marks: []}]
      const isPortableText = block && block._type === schemaTypes.block.name
      if (isPortableText) {
        const textBlock = block as PortableTextTextBlock
        let hasInlines = false
        const hasMissingStyle = typeof textBlock.style === 'undefined'
        const hasMissingMarkDefs = typeof textBlock.markDefs === 'undefined'
        const children = textBlock.children.map((child) => {
          const {_type: cType, _key: cKey, ...cRest} = child
          if (cType !== 'span') {
            hasInlines = true
            return keepObjectEquality(
              {
                _type: cType,
                _key: cKey,
                children: voidChildren,
                value: cRest,
                __inline: true,
              },
              keyMap
            )
          }
          // Original object
          return child
        })
        if (!hasMissingStyle && !hasMissingMarkDefs && !hasInlines && Element.isElement(block)) {
          // Original object
          return block
        }
        if (hasMissingStyle) {
          rest.style = schemaTypes.styles[0].value
        }
        if (hasMissingMarkDefs) {
          rest.markDefs = EMPTY_MARKDEFS
        }
        return keepObjectEquality({_type, _key, ...rest, children}, keyMap)
      }
      return keepObjectEquality(
        {
          _type,
          _key,
          children: voidChildren,
          value: rest,
        },
        keyMap
      )
    }) as Descendant[]
  }
  return []
}

export function fromSlateValue(
  value: (Node | Partial<Node>)[],
  textBlockType: string,
  keyMap: Record<string, PortableTextBlock | PortableTextChild> = {}
): PortableTextBlock[] {
  return value.map((block) => {
    const {_key, _type} = block
    if (!_key || !_type) {
      throw new Error('Not a valid block')
    }
    if (_type === textBlockType && 'children' in block && Array.isArray(block.children) && _key) {
      let hasInlines = false
      const children = block.children.map((child) => {
        const {_type: _cType} = child
        if ('value' in child && _cType !== 'span') {
          hasInlines = true
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const {value: v, _key: k, _type: t, __inline: _i, children: _c, ...rest} = child
          return keepObjectEquality({...rest, ...v, _key: k as string, _type: t as string}, keyMap)
        }
        return child
      })
      if (!hasInlines) {
        return block as PortableTextBlock // Original object
      }
      return keepObjectEquality({...block, children, _key, _type}, keyMap) as PortableTextBlock
    }
    const blockValue = 'value' in block && block.value
    return keepObjectEquality(
      {_key, _type, ...(typeof blockValue === 'object' ? blockValue : {})},
      keyMap
    ) as PortableTextBlock
  })
}

export function isEqualToEmptyEditor(
  children: Descendant[] | PortableTextBlock[],
  types: PortableTextMemberSchemaTypes
): boolean {
  return (
    children === undefined ||
    (children && Array.isArray(children) && children.length === 0) ||
    (children &&
      Array.isArray(children) &&
      children.length === 1 &&
      Element.isElement(children[0]) &&
      children[0]._type === types.block.name &&
      'style' in children[0] &&
      children[0].style === types.styles[0].value &&
      !('listItem' in children[0]) &&
      Array.isArray(children[0].children) &&
      children[0].children.length === 1 &&
      Text.isText(children[0].children[0]) &&
      children[0].children[0]._type === 'span' &&
      !children[0].children[0].marks?.join('') &&
      children[0].children[0].text === '')
  )
}

export function findBlockAndIndexFromPath(
  firstPathSegment: PathSegment,
  children: (Node | Partial<Node>)[]
): [Element | undefined, number | undefined] {
  let blockIndex = -1
  const isNumber = Number.isInteger(Number(firstPathSegment))
  if (isNumber) {
    blockIndex = Number(firstPathSegment)
  } else if (children) {
    blockIndex = children.findIndex(
      (blk) => Element.isElement(blk) && isEqual({_key: blk._key}, firstPathSegment)
    )
  }
  if (blockIndex > -1) {
    return [children[blockIndex] as Element, blockIndex]
  }
  return [undefined, -1]
}

export function findChildAndIndexFromPath(
  secondPathSegment: PathSegment,
  block: Element
): [Element | Text | undefined, number] {
  let childIndex = -1
  const isNumber = Number.isInteger(Number(secondPathSegment))
  if (isNumber) {
    childIndex = Number(secondPathSegment)
  } else {
    childIndex = block.children.findIndex((child) => isEqual({_key: child._key}, secondPathSegment))
  }
  if (childIndex > -1) {
    return [block.children[childIndex] as Element | Text, childIndex]
  }
  return [undefined, -1]
}

export function getValueOrInitialValue(
  value: unknown,
  initialValue: PortableTextBlock[]
): PortableTextBlock[] | undefined {
  if (value && Array.isArray(value) && value.length > 0) {
    return value
  }
  return initialValue
}
