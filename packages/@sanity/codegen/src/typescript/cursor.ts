export interface Cursor {
  (startOffset?: number, endOffset?: number): string
  position: number
  hasNext(): boolean
  consume: (expected?: string | RegExp) => string
}

export function createCursor(values: string): Cursor {
  let position = 0
  const hasNext = () => position < values.length
  const peek = (startOffset = 0, endOffset = 1) => {
    return values.slice(position + startOffset, position + endOffset) ?? ''
  }
  const consume = (expected?: string | RegExp) => {
    const length = typeof expected === 'string' ? expected.length : 1
    const current = peek(0, length)
    if (typeof expected === 'string' && expected !== current) {
      throw new SyntaxError(
        `Expected \`${expected}\` at position ${position}${
          current ? ` but got \`${current}\` instead` : ''
        }`,
      )
    }

    if (expected instanceof RegExp && !expected.test(current)) {
      throw new SyntaxError(
        `Expected character \`${current}\` at position ${position} to match ${expected}`,
      )
    }

    position += length
    return current
  }

  Object.defineProperty(peek, 'position', {get: () => position})
  return Object.assign(peek, {hasNext, consume}) as Cursor
}
