import {Prec, type Extension} from '@codemirror/state'
import {EditorView} from '@codemirror/view'

import {paramsExtensions, resultJsonExtensions} from '../../codemirror/extensions'

const HAS_SELECTION_CLASS = 'cm-vision-hasSelection'

/**
 * The redesign's gutter and active line, drawn from the card's CSS variables so they follow the
 * light and dark schemes: muted line numbers on the editor's own background, set apart from the
 * code by a thin divider, and, in the focused editor, the active line number in the text color
 * over a full-width band in the code background color, the way Structure's inspect dialog
 * highlights a line.
 *
 * The band is opaque and lines paint over the selection layer, so it is left out while anything
 * is selected rather than hiding the selection on its line.
 */
export const redesignEditorTheme: Extension = [
  EditorView.editorAttributes.compute(['selection'], (state): Record<string, string> =>
    state.selection.ranges.some((range) => !range.empty) ? {class: HAS_SELECTION_CLASS} : {},
  ),
  // Highest precedence, so these rules come after the base theme's and the shared Vision theme's,
  // whose light and dark variants are as specific
  Prec.highest(
    EditorView.theme({
      // The divider is drawn as a background so that it starts at the first line, below the
      // content's top padding, rather than running up into the label that floats over it
      '&.cm-editor .cm-gutters': {
        backgroundColor: 'transparent',
        backgroundImage: 'linear-gradient(var(--card-border-color), var(--card-border-color))',
        backgroundOrigin: 'border-box',
        backgroundPosition: 'right bottom',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1px calc(100% - var(--vision-editor-content-padding-top, 0px))',
        border: 'none',
        color: 'color-mix(in srgb, var(--card-muted-fg-color) 70%, transparent)',
      },
      '&.cm-editor .cm-lineNumbers .cm-gutterElement': {
        padding: '0 0.25rem 0 0.75rem',
        minWidth: '2ch',
      },
      '&.cm-editor .cm-activeLine, &.cm-editor .cm-activeLineGutter': {
        backgroundColor: 'transparent',
      },
      [`&.cm-editor.cm-focused:not(.${HAS_SELECTION_CLASS}) .cm-activeLine, &.cm-editor.cm-focused:not(.${HAS_SELECTION_CLASS}) .cm-activeLineGutter`]:
        {
          backgroundColor: 'var(--card-code-bg-color)',
        },
      '&.cm-editor.cm-focused .cm-activeLineGutter': {
        color: 'var(--card-fg-color)',
      },
      // The band's opaque background covers the divider, so the outermost gutter redraws it
      '&.cm-editor .cm-gutter:last-child .cm-activeLineGutter': {
        boxShadow: 'inset -1px 0 0 var(--card-border-color)',
      },
      // Bracket matching is marked with a faint tint and a hairline outline instead of the base
      // theme's saturated fill. The outline is an inset shadow so the mark takes no extra space,
      // and both are translucent so they read on the active line band as well as off it.
      '&.cm-editor.cm-focused .cm-matchingBracket': {
        backgroundColor: 'color-mix(in srgb, var(--card-muted-fg-color) 12%, transparent)',
        borderRadius: '2px',
        boxShadow:
          'inset 0 0 0 1px color-mix(in srgb, var(--card-muted-fg-color) 45%, transparent)',
      },
      '&.cm-editor.cm-focused .cm-nonmatchingBracket': {
        backgroundColor: 'color-mix(in srgb, var(--card-badge-critical-fg-color) 12%, transparent)',
        borderRadius: '2px',
        boxShadow:
          'inset 0 0 0 1px color-mix(in srgb, var(--card-badge-critical-fg-color) 45%, transparent)',
      },
    }),
  ),
]

export const redesignParamsExtensions: Extension[] = [...paramsExtensions, redesignEditorTheme]

export const redesignResultJsonExtensions: Extension[] = [
  ...resultJsonExtensions,
  redesignEditorTheme,
]
