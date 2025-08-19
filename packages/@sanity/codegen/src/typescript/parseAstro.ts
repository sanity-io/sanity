// Inspired by the official Astro compiler tokenizer:
// https://github.com/withastro/compiler/blob/%40astrojs/compiler%402.12.2/internal/token.go
import {createCursor, type Cursor} from './cursor'

export interface AstroFrontmatter {
  type: 'AstroFrontmatter'
  value: string
  start: number
  end: number
  range: [number, number]
}

/**
 * Extracts the JavaScript/TypeScript frontmatter from an Astro file.
 *
 * This parser is designed to be lightweight and fast, focusing only on
 * reliably extracting the code block between the `---` fences at the
 * beginning of an `.astro` file.
 *
 * @param source - The source code of the Astro file.
 * @returns An `AstroFrontmatter` object if frontmatter is found, otherwise `null`.
 */
export function extractAstroFrontmatter(source: string): AstroFrontmatter | null {
  return parseFrontmatter(createCursor(source))
}

/**
 * The core parsing logic for Astro frontmatter.
 *
 * It follows a state machine similar to the Go tokenizer's `frontmatter_loop`.
 * 1. Look for an opening `---` fence at the start of the file.
 * 2. If found, consume content until a closing `---` fence is detected.
 * 3. Handle string literals to avoid incorrectly matching `---` inside them.
 *
 * Ref: https://github.com/withastro/compiler/blob/40f79621e888a7c263158f7dc073fd5a7a935b03/internal/token.go#L1629
 */
function parseFrontmatter(cursor: Cursor): AstroFrontmatter | null {
  // The official tokenizer allows for leading whitespace before the frontmatter.
  // We will skip spaces and tabs, but not newlines, as the frontmatter must be at the very top.
  while (cursor.hasNext() && (cursor() === ' ' || cursor() === '\t')) {
    cursor.consume()
  }

  // Check for the opening `---` fence.
  if (cursor(0, 3) !== '---') return null
  cursor.consume('---')

  const start = cursor.position

  // Consume the opening `---`.

  let value = ''

  // Loop until we find the end fence or the end of the file.
  // This mirrors the `FrontmatterOpen` state in the Go tokenizer.
  while (cursor.hasNext()) {
    // Check for the closing `---` fence, which must be preceded by a newline.
    if (cursor(0, 4) === '\n---') {
      break
    }

    // To prevent incorrectly identifying `---` inside strings, we skip over them.
    // This is a simplified version of the Go tokenizer's string/comment handling within the frontmatter.
    // Ref: https://github.com/withastro/compiler/blob/40f79621e888a7c263158f7dc073fd5a7a935b03/internal/token.go#L1686
    if (/['"`]/.test(cursor())) {
      value += skipStringAndReturnContent(cursor)
      continue
    }

    // We must also handle comments to avoid `---` inside them being treated as a fence.
    if (cursor(0, 2) === '//' || cursor(0, 2) === '/*') {
      value += skipCommentAndReturnContent(cursor)
      continue
    }

    value += cursor.consume()
  }

  // Consume the closing `---` and the preceding newline.
  cursor.consume('\n---')

  const end = cursor.position

  return {
    type: 'AstroFrontmatter',
    // Trim the final newline from the captured value.
    value: value.trimEnd(),
    start,
    end,
    range: [start, end],
  }
}

/**
 * A utility to consume a string literal and return its content.
 * This is crucial for ensuring `---` inside a string isn't treated as a fence.
 * It also handles template literal expressions recursively.
 */
function skipStringAndReturnContent(cursor: Cursor): string {
  let content = ''
  const quote = cursor.consume(/['"`]/)
  content += quote

  while (cursor.hasNext()) {
    if (cursor() === quote) {
      content += cursor.consume()
      break
    }

    // Handle escaped characters.
    if (cursor() === '\\') {
      content += cursor.consume() // Consume the backslash
      if (cursor.hasNext()) {
        content += cursor.consume() // Consume the escaped character
      }
      continue
    }

    // Handle template literal expressions `${...}`.
    if (quote === '`' && cursor() === '$' && cursor(1) === '{') {
      content += cursor.consume() // $
      content += cursor.consume() // {
      content += skipTemplateExpressionAndReturnContent(cursor)
      continue
    }

    content += cursor.consume()
  }

  return content
}

function skipTemplateExpressionAndReturnContent(cursor: Cursor): string {
  let content = ''
  let braceDepth = 1

  while (cursor.hasNext() && braceDepth > 0) {
    if (cursor() === '}') {
      braceDepth--
      content += cursor.consume()
      continue
    }

    if (cursor() === '{') {
      braceDepth++
      content += cursor.consume()
      continue
    }

    if (cursor() === '"' || cursor() === "'" || cursor() === '`') {
      content += skipStringAndReturnContent(cursor)
      continue
    }

    content += cursor.consume()
  }

  // The final closing brace `}` is consumed by the loop, so we append it here.
  return content
}

function skipCommentAndReturnContent(cursor: Cursor): string {
  let content = ''

  if (cursor(0, 2) === '//') {
    // Line comment
    content += cursor.consume('//')
    while (cursor.hasNext() && cursor() !== '\n' && cursor() !== '\r') {
      content += cursor.consume()
    }
    return content
  }

  // Otherwise block comment
  content += cursor.consume('/*')
  while (cursor.hasNext()) {
    if (cursor(0, 2) === '*/') {
      content += cursor.consume('*/') // *
      break
    }
    content += cursor.consume()
  }
  return content
}
