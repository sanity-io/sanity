import {isEqual} from 'lodash'
import {Node, Element, Text, Descendant} from 'slate'
import {PathSegment} from '@sanity/types'
import {
  PortableTextBlock,
  PortableTextChild,
  PortableTextFeatures,
  TextBlock,
} from '../types/portableText'

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
  textBlockType: string,
  keyMap: Record<string, any> = {}
): Descendant[] {
  if (value && Array.isArray(value)) {
    return value.map((block) => {
      const {_type, _key, ...rest} = block
      const voidChildren = [{_key: `${_key}-void-child`, _type: 'span', text: '', marks: []}]
      const isPortableText = block && block._type === textBlockType
      if (isPortableText) {
        const textBlock = block as TextBlock
        let hasInlines = false
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
        if (!hasInlines && Element.isElement(block)) {
          // Original object
          return block
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
  if (value && Array.isArray(value)) {
    return value.map((block) => {
      if (Element.isElement(block)) {
        if (block._type === textBlockType) {
          let hasInlines = false
          const children = block.children.map((child) => {
            const {_type} = child
            if (
              Element.isElement(child) &&
              'value' in child &&
              _type !== 'span' &&
              typeof child.value === 'object'
            ) {
              hasInlines = true
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const {value: v, _key: k, _type: t, __inline: _i, children: _c, ...rest} = child
              return keepObjectEquality(
                {...rest, ...v, _key: k as string, _type: t as string},
                keyMap
              )
            }
            return child
          })
          if (typeof block._key === 'string' && typeof block._type === 'string') {
            if (!hasInlines) {
              // Original object
              return block
            }
            return keepObjectEquality(
              {...block, children, _key: block._key, _type: block._type},
              keyMap
            )
          }
          throw new Error('Not a valid block type')
        }
        const {_key, _type} = block
        const blockValue = 'value' in block && block.value
        return keepObjectEquality(
          {_key, _type, ...(typeof blockValue === 'object' ? blockValue : {})},
          keyMap
        )
      }
      return block as PortableTextBlock
    })
  }
  return value
}

export function isEqualToEmptyEditor(
  children: Node[] | undefined,
  portableTextFeatures: PortableTextFeatures
): boolean {
  return (
    children === undefined ||
    (children && Array.isArray(children) && children.length === 0) ||
    (children &&
      Array.isArray(children) &&
      children.length === 1 &&
      Element.isElement(children[0]) &&
      children[0]._type === portableTextFeatures.types.block.name &&
      'style' in children[0] &&
      children[0].style === portableTextFeatures.styles[0].value &&
      Array.isArray(children[0].children) &&
      children[0].children.length === 1 &&
      Text.isText(children[0].children[0]) &&
      children[0].children[0]._type === 'span' &&
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
