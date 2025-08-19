import {createCursor, type Cursor} from './cursor'

export interface Comment {
  type: 'Line' | 'Block'
  value: string
  start: number
  end: number
  range: [number, number]
}

/**
 * Extract all comments from TypeScript/JavaScript source code.
 * Handles edge cases like comments inside strings and template literals.
 */
function extractComments(source: string): Comment[] {
  return Array.from(parseComments(createCursor(source)))
}

function* parseComments(cursor: Cursor): Generator<Comment> {
  while (cursor.hasNext()) {
    if (cursor(0, 2) == '//') {
      yield parseLineComment(cursor)
      continue
    }

    if (cursor(0, 2) == '/*') {
      yield parseBlockComment(cursor)
      continue
    }

    if (cursor() === '"' || cursor() === "'") {
      // String literal - skip it to avoid false positives
      skipStringLiteral(cursor)
      continue
    }

    if (cursor() === '`') {
      // Template literal - skip it to avoid false positives
      skipTemplateLiteral(cursor)
      continue
    }

    cursor.consume()
  }
}

function parseLineComment(cursor: Cursor): Comment {
  const start = cursor.position

  cursor.consume('//')

  let value = ''

  // Read until end of line or end of file
  while (cursor.hasNext() && cursor() !== '\n' && cursor() !== '\r') {
    value += cursor.consume()
  }

  const end = cursor.position

  return {
    type: 'Line',
    value,
    start,
    end,
    range: [start, end],
  }
}

function parseBlockComment(cursor: Cursor): Comment {
  cursor.consume('/*')
  const start = cursor.position
  let value = ''

  // Read until '*/' or end of file
  while (cursor.hasNext()) {
    if (cursor(0, 2) === '*/') {
      // Found end of block comment
      cursor.consume('*/')
      break
    }

    value += cursor.consume()
  }

  const end = cursor.position

  return {
    type: 'Block',
    value,
    start,
    end,
    range: [start, end],
  }
}

function skipStringLiteral(cursor: Cursor): void {
  const quote = cursor.consume(/['"]/)

  while (cursor.hasNext()) {
    if (cursor() === quote) {
      cursor.consume(quote)
      return
    }

    if (cursor() === '\\') {
      cursor.consume('\\')
      cursor.consume() // Skip escaped character
      continue
    }

    cursor.consume()
  }
}

function skipTemplateLiteral(cursor: Cursor): void {
  cursor.consume('`')

  while (cursor.hasNext()) {
    if (cursor() === '`') {
      cursor.consume('`')
      return
    }

    if (cursor() === '\\') {
      cursor.consume('\\')
      cursor.consume() // Skip escaped character
      continue
    }

    if (cursor(0, 2) === '${') {
      skipTemplateExpression(cursor)
      continue
    }

    cursor.consume()
  }
}

function skipTemplateExpression(cursor: Cursor): void {
  cursor.consume('${')
  // We've already consumed the opening '${'
  skipUntilMatchingBrace(cursor)
}

function skipUntilMatchingBrace(cursor: Cursor): void {
  while (cursor.hasNext()) {
    if (cursor() === '}') {
      cursor.consume('}')
      return
    }

    if (cursor() === '{') {
      cursor.consume('{')
      skipUntilMatchingBrace(cursor)
      continue
    }

    // Handle nested contexts
    if (cursor() === '"' || cursor() === "'") {
      skipStringLiteral(cursor)
      continue
    }

    if (cursor() === '`') {
      skipTemplateLiteral(cursor)
      continue
    }

    cursor.consume()
  }
}

export {extractComments as parseComments}
