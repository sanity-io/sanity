import type {
  ArraySchemaType,
  PortableTextBlock,
  PortableTextObject,
  PortableTextTextBlock,
} from '@sanity/types'
import {flatten} from 'lodash'
import {findBlockType} from '../util/findBlockType'
import {resolveJsType} from '../util/resolveJsType'
import type {
  ArbitraryTypedObject,
  DeserializerRule,
  HtmlDeserializerOptions,
  PlaceholderAnnotation,
  PlaceholderDecorator,
  TypedObject,
} from '../types'
import {createRules} from './rules'
import {
  createRuleOptions,
  defaultParseHtml,
  ensureRootIsBlocks,
  flattenNestedBlocks,
  trimWhitespace,
  preprocess,
  tagName,
  isNodeList,
  isMinimalSpan,
  isPlaceholderDecorator,
  isPlaceholderAnnotation,
  isMinimalBlock,
} from './helpers'

/**
 * HTML Deserializer
 *
 */
export default class HtmlDeserializer {
  blockContentType: ArraySchemaType
  rules: DeserializerRule[]
  parseHtml: (html: string) => HTMLElement
  _markDefs: PortableTextObject[] = []

  /**
   * Create a new serializer respecting a Sanity block content type's schema
   *
   * @param blockContentType - Schema type for array containing _at least_ a block child type
   * @param options - Options for the deserialization process
   */
  constructor(blockContentType: ArraySchemaType, options: HtmlDeserializerOptions = {}) {
    const {rules = []} = options
    if (!blockContentType) {
      throw new Error("Parameter 'blockContentType' is required")
    }
    const standardRules = createRules(blockContentType, createRuleOptions(blockContentType))
    this.rules = [...rules, ...standardRules]
    const parseHtml = options.parseHtml || defaultParseHtml()
    this.blockContentType = blockContentType
    this.parseHtml = (html) => {
      const doc = preprocess(html, parseHtml)
      return doc.body
    }
  }

  /**
   * Deserialize HTML.
   *
   * @param html - The HTML to deserialize, as a string
   * @returns Array of blocks - either portable text blocks or other allowed blocks
   */
  deserialize = (html: string): TypedObject[] => {
    this._markDefs = []
    const {parseHtml} = this
    const fragment = parseHtml(html)
    const children = Array.from(fragment.childNodes) as HTMLElement[]
    // Ensure that there are no blocks within blocks, and trim whitespace
    const blocks = trimWhitespace(
      flattenNestedBlocks(ensureRootIsBlocks(this.deserializeElements(children))),
    )

    if (this._markDefs.length > 0) {
      blocks
        .filter((block): block is PortableTextTextBlock => block._type === 'block')
        .forEach((block) => {
          block.markDefs = block.markDefs || []
          block.markDefs = block.markDefs.concat(
            this._markDefs.filter((def) => {
              return flatten(block.children.map((child) => child.marks || [])).includes(def._key)
            }),
          )
        })
    }

    // Set back the potentially hoisted block type
    const type = this.blockContentType.of.find(findBlockType)
    if (!type) {
      return blocks
    }

    return blocks.map((block) => {
      if (block._type === 'block') {
        block._type = type.name
      }
      return block
    })
  }

  /**
   * Deserialize an array of DOM elements.
   *
   * @param elements - Array of DOM elements to deserialize
   * @returns
   */
  deserializeElements = (elements: Node[] = []): TypedObject[] => {
    let nodes: TypedObject[] = []
    elements.forEach((element) => {
      nodes = nodes.concat(this.deserializeElement(element))
    })
    return nodes
  }

  /**
   * Deserialize a DOM element
   *
   * @param element - Deserialize a DOM element
   * @returns
   */
  deserializeElement = (element: Node): TypedObject | TypedObject[] => {
    const next = (elements: Node | Node[] | NodeList): TypedObject | TypedObject[] | undefined => {
      if (isNodeList(elements)) {
        return this.deserializeElements(Array.from(elements))
      }

      if (Array.isArray(elements)) {
        return this.deserializeElements(elements)
      }

      if (!elements) {
        return undefined
      }

      return this.deserializeElement(elements)
    }

    const block = (props: ArbitraryTypedObject) => {
      return {
        _type: '__block',
        block: props,
      }
    }

    let node
    for (let i = 0; i < this.rules.length; i++) {
      const rule = this.rules[i]
      if (!rule.deserialize) {
        continue
      }

      const ret = rule.deserialize(element, next, block)
      const type = resolveJsType(ret)

      if (type !== 'array' && type !== 'object' && type !== 'null' && type !== 'undefined') {
        throw new Error(`A rule returned an invalid deserialized representation: "${node}".`)
      }

      if (ret === undefined) {
        continue
      } else if (ret === null) {
        throw new Error('Deserializer rule returned `null`')
      } else if (Array.isArray(ret)) {
        node = ret
      } else if (isPlaceholderDecorator(ret)) {
        node = this.deserializeDecorator(ret)
      } else if (isPlaceholderAnnotation(ret)) {
        node = this.deserializeAnnotation(ret)
      } else {
        node = ret
      }

      // Set list level on list item
      if (ret && !Array.isArray(ret) && isMinimalBlock(ret) && 'listItem' in ret) {
        let parent = element.parentNode?.parentNode
        while (parent && tagName(parent) === 'li') {
          parent = parent.parentNode?.parentNode
          ret.level = ret.level ? ret.level + 1 : 1
        }
      }

      // Set newlines on spans orginating from a block element within a blockquote
      if (ret && !Array.isArray(ret) && isMinimalBlock(ret) && ret.style === 'blockquote') {
        ret.children.forEach((child, index) => {
          if (isMinimalSpan(child) && child.text === '\r') {
            child.text = '\n\n'
            if (index === 0 || index === ret.children.length - 1) {
              ret.children.splice(index, 1)
            }
          }
        })
      }
      break
    }

    return node || next(element.childNodes) || []
  }

  /**
   * Deserialize a `__decorator` type
   * (an internal made up type to process decorators exclusively)
   *
   * @param decorator -
   * @returns array of ...
   */
  deserializeDecorator = (decorator: PlaceholderDecorator): TypedObject[] => {
    const {name} = decorator
    const applyDecorator = (node: TypedObject) => {
      if (isPlaceholderDecorator(node)) {
        return this.deserializeDecorator(node)
      } else if (isMinimalSpan(node)) {
        node.marks = node.marks || []
        if (node.text.trim()) {
          // Only apply marks if this is an actual text
          node.marks.unshift(name)
        }
      } else if ('children' in node && Array.isArray((node as PortableTextBlock).children)) {
        const block = node as any
        block.children = block.children.map(applyDecorator)
      }
      return node
    }
    return decorator.children.reduce((children, node) => {
      const ret = applyDecorator(node)
      if (Array.isArray(ret)) {
        return children.concat(ret)
      }
      children.push(ret)
      return children
    }, [] as TypedObject[])
  }

  /**
   * Deserialize a `__annotation` object.
   * (an internal made up type to process annotations exclusively)
   *
   * @param annotation -
   * @returns Array of...
   */
  deserializeAnnotation = (annotation: PlaceholderAnnotation): TypedObject[] => {
    const {markDef} = annotation
    this._markDefs.push(markDef)
    const applyAnnotation = (node: TypedObject) => {
      if (isPlaceholderAnnotation(node)) {
        return this.deserializeAnnotation(node)
      } else if (isMinimalSpan(node)) {
        node.marks = node.marks || []
        if (node.text.trim()) {
          // Only apply marks if this is an actual text
          node.marks.unshift(markDef._key)
        }
      } else if ('children' in node && Array.isArray((node as PortableTextBlock).children)) {
        const block = node as any
        block.children = block.children.map(applyAnnotation)
      }
      return node
    }
    return annotation.children.reduce((children, node) => {
      const ret = applyAnnotation(node)
      if (Array.isArray(ret)) {
        return children.concat(ret)
      }
      children.push(ret)
      return children
    }, [] as TypedObject[])
  }
}
