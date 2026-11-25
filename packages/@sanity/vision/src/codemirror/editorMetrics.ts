import {rem} from '@sanity/ui'

/** The text size of Vision's editors, in pixels */
export const EDITOR_FONT_SIZE = 16

/** The height of an editor line relative to its text size, the factor CodeMirror's base theme uses */
export const EDITOR_LINE_HEIGHT = 1.4

/** The height of one editor line, in CSS pixels */
export const editorLineHeight = `${EDITOR_FONT_SIZE * EDITOR_LINE_HEIGHT}px`

/**
 * The space above the first line of an editor under a header: none, so the header's scrolled
 * border lands on it at once
 */
const EDITOR_UNDER_HEADER_PADDING_TOP = '0px'

/**
 * The space above an editor's first line. The tall padding of an editor that is not under a
 * header makes room for the label floating over it.
 */
export function editorContentPaddingTop(space: readonly number[], underHeader: boolean): string {
  return underHeader ? EDITOR_UNDER_HEADER_PADDING_TOP : `${rem(space[5])}`
}

/**
 * Sets a line of text in the box of the first line of an editor under a header: as far below the
 * top and as tall, so text in a pane beside the editor lines up with that line and its active-line
 * band whatever its own size
 */
export const firstEditorLineStyle = {
  paddingTop: EDITOR_UNDER_HEADER_PADDING_TOP,
  lineHeight: editorLineHeight,
} as const
