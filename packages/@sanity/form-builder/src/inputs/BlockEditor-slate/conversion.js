import {Mark, Raw} from 'slate'
import {Set} from 'immutable'

// Converts custom paragraph nodes from sanity to slate form
function customSanitySpanNodeToSlateRaw(node) {
  throw new Error(`Unexpected call to customSanitySpanNodeToSlateRaw for span of type ${node._type} since we have no supported custom nodes yet`)
}

// Converts a sanity 'textspan' to a 'range' for use in a slate 'text' node
function textSpanToSlateRange(input, index) {
  const output = {
    text: input.content
  }
  if (input.marks) {
    output.marks = input.marks.map(tag => {
      return {
        type: tag,
        data: {}
      }
    })
  } else {
    output.marks = []
  }
  // To make sure we maintain the same object structure as we move the data back and forth via the slate character
  // array, we'll mark each character with the span index it came from. This must never leak back into the database,
  // and is only intended as internal book-keeping.
  output.marks.push({
    type: '__spanIdx',
    data: {
      index: index
    }
  })
  return output
}

// Converts a chain of sanity 'textspan' nodes to a slate 'text' node with 'ranges'
function consecutiveSpansToSlateText(textspans) {
  return {
    kind: 'text',
    ranges: textspans.map(textSpanToSlateRange)
  }
}

// Converts a sanity block text paragraph to slate form
function sanityParagraphToSlateRaw(input) {
  const output = {
    kind: 'block',
    type: 'paragraph',
    key: input._key,
    nodes: []
  }
  let consecutiveSpans = []
  input.nodes.forEach(node => {
    if (node._type == 'textspan') {
      consecutiveSpans.push(node)
    } else {
      output.nodes = output.nodes.concat(consecutiveSpansToSlateText(consecutiveSpans), customSanitySpanNodeToSlateRaw(node))
      consecutiveSpans = []
    }
  })
  output.nodes = output.nodes.concat(consecutiveSpansToSlateText(consecutiveSpans))
  return output
}

// Converts one root level sanity encoded block to its corresponding slate raw object encoding
export function sanityBlockNodeToSlateRaw(input) {
  switch (input._type) {
    case 'paragraph':
      return sanityParagraphToSlateRaw(input)
    default:
      throw new Error(`Unknown block text block type ${input._type}`)
  }
}

function sanityBlockArrayToSlateRawState(sanityBlockText) {
  return {
    kind: 'state',
    document: {
      kind: 'document',
      nodes: sanityBlockText.map(sanityBlockNodeToSlateRaw)
    }
  }
}

export function sanityBlockArrayToSlateDocument(sanityBlockText) {
  const raw = sanityBlockArrayToSlateRawState(sanityBlockText)
  return Raw.deserialize(raw).get('document')
}

// Convert the slate native tags to sanity representation, also strips out the internal mark that we use to keep
// track of span indexes as it is not a part of the external abstraction, only used to bridge a few impedance
// mismatches between modelling paragraphs as arrays of characters (slate), and arrays of spans (sanity)
export function slateMarksToSanity(marks) {
  const result = []
  marks.forEach(mark => {
    const tag = mark.get('type')
    if (tag != '__spanIdx') {
      result.push(mark.get('type'))
    }
  })
  return result
}

export function sanityMarksToSlate(tags) {
  return new Set(tags.map(tag => {
    return Mark.create({type: tag, data: {}})
  }))
}
