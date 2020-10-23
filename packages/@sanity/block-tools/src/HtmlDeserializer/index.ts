import {flatten} from 'lodash'
import resolveJsType from '../util/resolveJsType'
import blockContentTypeFeatures from '../util/blockContentTypeFeatures'
import {
  createRuleOptions,
  defaultParseHtml,
  ensureRootIsBlocks,
  flattenNestedBlocks,
  trimWhitespace,
  preprocess,
  tagName,
} from './helpers'
import createRules from './rules'

/**
 * A internal variable to keep track of annotation mark definitions
 *
 */
let _markDefs = []

/**
 * HTML Deserializer
 *
 */
export default class HtmlDeserializer {
  blockContentType: any
  rules: any[]
  parseHtml: (html: string) => any
  /**
   * Create a new serializer respecting a Sanity block content type's schema
   *
   * @param {Object} options
   *   @property {Object} blockContentType
   *      A compiled version of the block content schema type
   *   @property {Array} rules
   *      Optional rules working on the HTML (will be ruled first)
   *   @property {Function} parseHtml
   *      API compatible model as returned from DOMParser for using server side.
   */

  constructor(blockContentType, options: any = {}) {
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
   * @param {String} html
   * @return {Array}
   */
  deserialize = (html) => {
    _markDefs = []
    const {parseHtml} = this
    const fragment = parseHtml(html)
    const children = Array.from(fragment.childNodes)
    // Ensure that there are no blocks within blocks, and trim whitespace
    const blocks = trimWhitespace(
      flattenNestedBlocks(ensureRootIsBlocks(this.deserializeElements(children)))
    )
    if (_markDefs.length > 0) {
      blocks
        .filter((block) => block._type === 'block')
        .forEach((block) => {
          block.markDefs = block.markDefs || []
          block.markDefs = block.markDefs.concat(
            _markDefs.filter((def) => {
              return flatten(block.children.map((child) => child.marks || [])).includes(def._key)
            })
          )
        })
    }
    // Set back the potentially hoisted block type
    const type = this.blockContentType.of.find(findBlockType)
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
   * @param {Array} elements
   * @return {Array}
   */
  deserializeElements = (elements = []) => {
    let nodes = []
    elements.forEach((element, index) => {
      const node = this.deserializeElement(element)
      switch (resolveJsType(node)) {
        case 'array':
          nodes = nodes.concat(node)
          break
        case 'object':
          nodes.push(node)
          break
        default:
          throw new Error(`Don't know what to do with: ${JSON.stringify(node)}`)
      }
    })
    return nodes
  }

  /**
   * Deserialize a DOM element.
   *
   * @param {Object} element
   * @return {Any}
   */
  // eslint-disable-next-line complexity
  deserializeElement = (element) => {
    let node
    if (!element.tagName) {
      element.tagName = ''
    }

    const next = (elements) => {
      let _elements = elements
      if (Object.prototype.toString.call(_elements) == '[object NodeList]') {
        _elements = Array.from(_elements)
      }

      switch (resolveJsType(_elements)) {
        case 'array':
          return this.deserializeElements(_elements)
        case 'object':
          return this.deserializeElement(_elements)
        case 'null':
        case 'undefined':
          return undefined
        default:
          throw new Error(`The \`next\` argument was called with invalid children: "${_elements}".`)
      }
    }

    const block = (props) => {
      return {
        _type: '__block',
        block: props,
      }
    }

    for (let i = 0; i < this.rules.length; i++) {
      const rule = this.rules[i]
      if (!rule.deserialize) {
        continue
      }
      const ret = rule.deserialize(element, next, block)
      const type = resolveJsType(ret)

      if (type != 'array' && type != 'object' && type != 'null' && type != 'undefined') {
        throw new Error(`A rule returned an invalid deserialized representation: "${node}".`)
      }

      if (ret === undefined) {
        continue
      } else if (ret === null) {
        return null
      } else if (ret._type === '__decorator') {
        node = this.deserializeDecorator(ret)
      } else if (ret._type === '__annotation') {
        node = this.deserializeAnnotation(ret)
      } else {
        node = ret
      }
      // Set list level on list item
      if (ret && ret._type === 'block' && ret.listItem) {
        let parent = element.parentNode.parentNode
        while (tagName(parent) === 'li') {
          parent = parent.parentNode.parentNode
          ret.level++
        }
      }
      // Set newlines on spans orginating from a block element within a blockquote
      if (ret && ret._type === 'block' && ret.style === 'blockquote') {
        ret.children.forEach((child, index) => {
          if (child._type === 'span' && child.text === '\r') {
            child.text = '\n\n'
            if (index === 0 || index === ret.children.length - 1) {
              ret.children.splice(index, 1)
            }
          }
        })
      }
      break
    }
    return node || next(element.childNodes)
  }

  /**
   * Deserialize a `__decorator` type
   * (an internal made up type to process decorators exclusively)
   *
   * @param {Object} decorator
   * @return {Array}
   */
  deserializeDecorator = (decorator) => {
    const {name} = decorator
    const applyDecorator = (node) => {
      if (node._type === '__decorator') {
        return this.deserializeDecorator(node)
      } else if (node._type === 'span') {
        node.marks = node.marks || []
        if (node.text.trim()) {
          // Only apply marks if this is an actual text
          node.marks.unshift(name)
        }
      } else if (node.children) {
        node.children = node.children.map(applyDecorator)
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
    }, [])
  }

  /**
   * Deserialize a `__annotation` object.
   * (an internal made up type to process annotations exclusively)
   *
   * @param {Object} annotation
   * @return {Array}
   */
  deserializeAnnotation = (annotation) => {
    const {markDef} = annotation
    _markDefs.push(markDef)
    const applyAnnotation = (node) => {
      if (node._type === '__annotation') {
        return this.deserializeAnnotation(node)
      } else if (node._type === 'span') {
        node.marks = node.marks || []
        if (node.text.trim()) {
          // Only apply marks if this is an actual text
          node.marks.unshift(markDef._key)
        }
      } else if (node.children) {
        node.children = node.children.map(applyAnnotation)
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
    }, [])
  }
}

function findBlockType(type) {
  if (type.type) {
    return findBlockType(type.type)
  }

  if (type.name === 'block') {
    return type
  }

  return null
}
