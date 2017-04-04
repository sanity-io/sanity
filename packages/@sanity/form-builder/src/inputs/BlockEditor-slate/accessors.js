import {flatten, isEqual} from 'lodash'

import {ImmutableAccessor} from '@sanity/mutator'

import randomKey from '../Array/randomKey'
import {splitTextNodeIntoArraysOfCharacterBySpan, spanAccessorsToSlateNodes} from './docUtils'
import {slateMarksToSanity} from './conversion'

// This accessor is meant to access nodes that are not common text nodes, but alas it has not yet been
// implemented.
export class NodeAccessor {
  constructor(node) {
    this.node = node
  }

  containerType() {
    return 'object'
  }

  getAttribute(attr) {
    // TODO
    return new ImmutableAccessor(this.node)
  }

  setAttribute(key, value) {
    return new NodeAccessor(this.node.setIn([key], value))
  }

  setAttributeAccessor(key, accessor) {
    return this
  }

  hasAttribute(key) {
    return key === 'nodes'
  }
}

// Represents a span of characters with identical marks. In Sanity terms this accessor corresponds to a single
// 'textspan', in Slate terms it corresponds to a consecutive array of characters of identical marks within a
// text node.
export class TextSpanAccessor {
  static createFromTextNode(key, textSpan) {
    const content = textSpan.map(char => char.get('text')).join('')
    const marks = textSpan.length > 0 ? slateMarksToSanity(textSpan[0].get('marks')) : []
    return new TextSpanAccessor({key, content, marks})
  }

  serialize() {
    const result = {
      _type: 'textspan',
      content: this.content,
    }
    if (this.marks.length > 0) {
      result.marks = this.marks
    }
    return result
  }

  constructor({key, content, marks}) {
    this.key = key
    this.content = content
    this.marks = marks
  }

  containerType() {
    return 'object'
  }

  getAttribute(attr) {
    if (attr === '_type') {
      return new ImmutableAccessor('textspan')
    }
    if (attr === 'content') {
      return new ImmutableAccessor(this.content)
    }
    if (attr === 'marks') {
      return new ImmutableAccessor(this.marks)
    }
    throw new Error(`Unknown key "${attr}"`)
  }

  setAttribute(attr, value) {
    if (attr === 'content') {
      return new TextSpanAccessor({content: value, marks: this.marks, key: this.key})
    }
    if (attr === 'marks') {
      return new TextSpanAccessor({content: this.content, marks: value, key: this.key})
    }
    throw new Error(`Unable to set attribute "${attr}" of type textspan`)
  }

  setAttributeAccessor(attr, value) {
    if (attr === 'content') {
      return new TextSpanAccessor({content: value.get(), marks: this.mark, key: this.keys})
    }
    if (attr === 'marks') {
      return new TextSpanAccessor({content: this.content, marks: value.get(), key: this.key})
    }
    throw new Error(`Unable to set attribute "${attr}" of type textspan`)
  }

  hasAttribute(attr) {
    return attr === 'content' || attr === 'marks' || attr === '_type'
  }
}

// Represents the spans of a paragraph. The impedance mismatch between the slate native representation and the sanity representation
// is problematic here as a single text node with different stylings, i.e. something like "this is <em>important</em>" are represented
// as individual textspan nodes i sanity, while they are one character array within slate. The SpanAccessor solves this problem by converting
// the entire nodes array into an array of accessors immediately upon creation.
//
// TODO: Sine accessors often are only bypassed very quickly while patching something deep inside them, this would probably do well to
// rather work lazily, only converting exactly what is being asked for to accessors. But this is complex and is left as an exercise for the
// future.

export class SpansAccessor {
  static createFromSlateParagraph(paragraph) {
    const spans = flatten(
      paragraph.nodes.toArray().map(childNode => {
        if (childNode.kind === 'text') {
          return splitTextNodeIntoArraysOfCharacterBySpan(childNode).map(textNode => TextSpanAccessor.createFromTextNode(childNode.key, textNode))
        }
        return new NodeAccessor(childNode)
      })
    )
    if (spans.length == 0) {
      // There is always at least one span, albeit an empty one
      return new SpansAccessor([
        new TextSpanAccessor({
          key: randomKey(12),
          content: '',
          marks: []
        })
      ])
    }
    return new SpansAccessor(spans)
  }

  serialize() {
    const length = this.length()
    const result = []
    for (let i = 0; i < length; i++) {
      result.push(this.getIndex(i))
    }
    return result
  }

  // In order to maintain compatibility with the Sanity model we may accrue some inefficiencies in the encoding during editing of a
  // block. This method generates an optional clean up patch which would be good to apply every now and then
  generateCleanUpPatch() {
    const patches = []
    // Then, let's find all empty spans
    const indiciesToDelete = []
    const spansAfterPruning = []
    this.spans.forEach((span, index) => {
      if (span.getAttribute('_type').get() == 'textspan') {
        if (span.content.length == 0) {
          indiciesToDelete.push(index)
          return
        }
      }
      spansAfterPruning.push(span)
    })
    // Generate a patch deleting all these spans
    if (indiciesToDelete.length > 0) {
      patches.push({
        type: 'unset',
        path: [JSON.stringify(indiciesToDelete)]
      })
    }
    // spansAfterPruning now contain the array of spans as it will look after that above patch
    // Now let's go through them and combine any consecutive spans with identical marks into single
    // spans.
    const groups = []
    let group = null
    spansAfterPruning.forEach((span, index) => {
      if (span.getAttribute('_type').get() == 'textspan') {
        if (group && isEqual(group.marks, span.marks)) {
          group.spans.push(span)
          group.lastIndex = index
          return
        }
        if (group && group.spans.length > 1) {
          groups.push(group)
        }
        group = {
          marks: span.marks,
          firstIndex: index,
          lastIndex: index,
          spans: [span]
        }
        return
      }
      if (group && group.spans.length > 1) {
        groups.push(group)
      }
      group = null
    })
    // Now groups contain only consecutive spans with identical marks, we may replace them with merged
    // versions of the same content. As each of these mutations change the length of the array, we must do them in
    // reverse order from back to front so that our indicies stay valid as we mutate
    groups.reverse().forEach(group => {
      const value = {
        _type: 'textspan',
        content: group.spans.map(span => span.content).join('')
      }
      if (group.marks.length > 0) {
        value.marks = group.marks
      }
      patches.push({
        type: 'insert',
        position: 'replace',
        path: [`[${group.firstIndex}:${group.lastIndex}]`],
        value: [value]
      })
    })
    return patches
  }

  constructor(spans) {
    this.spans = spans
  }

  containerType() {
    return 'array'
  }

  length() {
    return this.spans.length
  }

  setIndexAccessor(index, accessor) {
    const nextSpans = this.spans.slice()
    nextSpans[index] = accessor
    return new SpansAccessor(nextSpans)
  }

  setIndex(index, value) {
    throw new Error('setIndex w/o wrapping in accessor not supported for SpansAccessor yet.')
  }

  getIndex(index) {
    return this.spans[index]
  }

  insertItemsAt(pos, items) {
    const itemAccessors = items.map(item => {
      // TODO: Standard way of creating appropriate containers on any item
      if (item._type == 'textspan') {
        return new TextSpanAccessor(item)
      }
      throw new Error(`Unsupported item type "${item._type}"`)
    })

    let nextSpans
    if (this.spans.length == 0 && pos == 0) {
      nextSpans = itemAccessors
    } else {
      nextSpans = this.spans.slice(0, pos).concat(itemAccessors).concat(this.spans.slice(pos))
    }
    return new SpansAccessor(nextSpans)
  }

  get() {
    // Convert internal intermediate format back to slate native format
    return spanAccessorsToSlateNodes(this.spans)
  }
}

// Wraps a native slate paragraph representation, i.e. a Text node with spans
export class ParagraphAccessor {
  constructor(paragraph) {
    this.paragraph = paragraph
  }

  serialize() {
    return {
      _type: 'paragraph',
      _key: this.paragraph.get('key'),
      nodes: this.getAttribute('nodes').serialize()
    }
  }

  containerType() {
    return 'object'
  }

  getAttribute(key) {
    if (key === '_key') {
      return new ImmutableAccessor(this.paragraph.get('key'))
    }
    if (key === 'nodes') {
      return SpansAccessor.createFromSlateParagraph(this.paragraph)
    }
    throw new Error(`Invalid attribute: ${key}`)
  }

  setAttribute(key, value) {
    throw new Error(`setAttribute not supported (yet, do we need it?)`)
  }

  setAttributeAccessor(key, accessor) {
    if (key === 'nodes') {
      // convert SpansAccessor.spans to nodes array
      return new ParagraphAccessor(this.paragraph.setIn(['nodes'], accessor.get()))
    }
    throw new Error(`Invalid attribute for ParagraphAccessor: ${key}`)
  }

  hasAttribute(key) {
    return key === 'nodes' || key === '_key'
  }

  get() {
    return this.paragraph
  }
}
