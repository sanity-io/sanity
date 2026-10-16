import {parse} from 'groq-js'
import {describe, expect, it} from 'vitest'

import {
  findGroqFunction,
  functionId,
  GROQ_FUNCTIONS,
  type GroqFunctionDoc,
  isKnownGroqFunction,
} from './groqFunctionReference'

/** Content Lake functions groq-js does not implement */
const NOT_IN_GROQ_JS = new Set(['geo', 'text::highlight'])

function callWith(doc: GroqFunctionDoc, count: number): string {
  const call = `${functionId(doc)}(${Array.from({length: count}, () => 'null').join(', ')})`
  if (doc.pipe) return `* | ${call}`
  if (doc.scoreOnly) return `* | score(${call})`
  return call
}

describe('GROQ_FUNCTIONS', () => {
  it('lists every function once', () => {
    const ids = GROQ_FUNCTIONS.map((doc) => functionId(doc))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('names functions groq-js parses, with argument counts it accepts', () => {
    for (const doc of GROQ_FUNCTIONS) {
      if (NOT_IN_GROQ_JS.has(functionId(doc))) continue
      const options = doc.deltaOnly ? {mode: 'delta' as const} : {}
      const counts = doc.args
        ? [doc.args.min, ...(doc.args.max === Infinity ? [] : [doc.args.max])]
        : [1]
      for (const count of counts) {
        expect(() => parse(callWith(doc, count), options), callWith(doc, count)).not.toThrow()
      }
    }
  })

  it('finds functions with or without the global namespace, and knows undocumented ones', () => {
    expect(findGroqFunction(undefined, 'count')?.signature).toBe('count(<array>) <integer>')
    expect(findGroqFunction('global', 'count')).toBe(findGroqFunction(undefined, 'count'))
    expect(findGroqFunction('pt', 'text')?.namespace).toBe('pt')
    expect(findGroqFunction('pt', 'nope')).toBeUndefined()
    expect(isKnownGroqFunction(undefined, 'anywhere')).toBe(true)
    expect(isKnownGroqFunction('documents', 'incomingRefCount')).toBe(true)
    expect(isKnownGroqFunction('ex', 'author')).toBe(false)
  })
})
