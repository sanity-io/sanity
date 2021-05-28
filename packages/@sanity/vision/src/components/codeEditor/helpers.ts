import {CodeEditorCursor} from './types'

export function getCursorOffset(code: string, cursor: CodeEditorCursor): number {
  const lines = code.split('\n')

  const lenBefore = lines
    .slice(0, cursor.line)
    .map((l) => l.length + 1)
    .reduce((acc, l) => (acc += l), 0)

  return lenBefore + cursor.column
}

export function getCursor(code: string, cursorOffset: number): CodeEditorCursor {
  const lines = code.split('\n')

  let offset = cursorOffset
  let line = 0
  let column = 0

  for (let i = 0; i < lines.length; i += 1) {
    if (offset <= lines[i].length) {
      line = i
      column = offset
      break
    }

    offset -= lines[i].length + 1
  }

  return {line, column}
}
