import {flatten} from 'lodash'
import Immutable from 'immutable'
import {Mark, Text, Character} from 'slate'

import {TextSpanAccessor} from './accessors'
import {sanityMarksToSlate} from './conversion'

// Given marks extracts the embedded special mark that tells us which span index that char
// is in according to the document structure in Sanity
function extractSpanIndexFromMarks(marks) {
  const indexMark = marks.find(mark => mark.get('type') == '__spanIdx')
  if (indexMark) {
    return indexMark.get('data').get('index')
  }
  return null
}

// Take a slate text node and split it into an array of arrays of characters splitting every time
// marks change so that each array corresponds to one consecutive "span" of characters with identical
// formatting.
export function splitTextNodeIntoArraysOfCharacterBySpan(textNode) {
  const result = textNode.characters.reduce((acc, char, idx) => {
    const prevChar = idx > 0 && textNode.characters.get(idx - 1)
    if (prevChar && Immutable.is(prevChar.marks, char.marks)) {
      acc[acc.length - 1].push(char)
    } else {
      // Find the span index of the next character and insert empty spans if need be to
      // make that next char still be in a span of that index. This is to ensure that the document structure
      // stays as described in the source Sanity document.
      const nextSpanIndex = extractSpanIndexFromMarks(char.marks) || 0
      while (acc.length < nextSpanIndex) {
        acc.push([])
      }
      acc.push([char])
    }
    return acc
  }, [])
  return result
}

// Take a number of consecutive sanity spans and join them together into an immutable character array for use with slate
function consecutiveSanitySpansToSlateText(key, spans, firstIndex) {
  let index = firstIndex
  const chars = flatten(spans.map(span => {
    // Convert the marks from the span and add the book-keeping tag to keep track of which span each character belongs to
    const marks = sanityMarksToSlate(span.marks).add(Mark.create({
      type: '__spanIdx',
      data: {index}
    }))
    index += 1
    return span.content.split('').map(char => ({text: char, marks: marks}))
  }))
  return Text.create({
    key,
    characters: Immutable.List(chars.map(({text, marks}) => Character.create({text, marks})))
  })
}

// Takes an array of span accessors and converts them into the corresponding list of immutable slate spans
export function spanAccessorsToSlateNodes(spans) {
  let joined = Immutable.List()
  let i = 0
  while (i < spans.length) {
    const span = spans[i]
    if (span instanceof TextSpanAccessor) {
      const firstIndex = i
      // consume until we get something else
      let next = i
      while (next < spans.length && (spans[next] instanceof TextSpanAccessor)) {
        next++
      }
      joined = joined.push(consecutiveSanitySpansToSlateText(span.key, spans.slice(i, next), firstIndex))
      i = next
    }
  }

  return joined
}
