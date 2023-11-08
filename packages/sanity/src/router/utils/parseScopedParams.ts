import {InternalSearchParam} from '../types'

export function parseScopedParams(params: [key: string, value: string][]): InternalSearchParam[] {
  return params.map(([key, value]) => [parse(key), value])
}

const OPEN = 1
const CLOSED = 0

function parse(str: string) {
  const result = []
  let i = 0
  let state = CLOSED
  while (i < str.length) {
    const nextBracketIdx = str.indexOf('[', i)
    if (nextBracketIdx === -1) {
      result.push(str.slice(i, str.length))
      break
    }
    if (state === OPEN) {
      throw new Error('Nested brackets not supported')
    }
    state = OPEN
    if (nextBracketIdx > i) {
      result.push(str.slice(i, nextBracketIdx))
      i = nextBracketIdx
    }

    const nextClosing = str.indexOf(']', nextBracketIdx)
    if (nextClosing === -1) {
      if (state === OPEN) {
        throw new Error('Unclosed bracket')
      }
      break
    }
    state = CLOSED
    result.push(str.slice(i + 1, nextClosing))
    i = nextClosing + 1
  }
  return result
}
