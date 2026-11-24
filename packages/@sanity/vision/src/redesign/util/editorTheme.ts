import {foldGutter} from '@codemirror/language'
import {Prec, type Extension} from '@codemirror/state'
import {EditorView} from '@codemirror/view'

import {paramsExtensions, readOnlyJsonExtensions} from '../../codemirror/extensions'
import {PARAM_LINT_MARK_CLASS} from './groqLint'
import {PARAM_HIGHLIGHT_CLASS} from './paramHighlight'

const HAS_SELECTION_CLASS = 'cm-vision-hasSelection'
const FOLD_MARKER_CLASS = 'cm-vision-foldMarker'
const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * The fold gutter's marker: the redesign's chevron icon (`ChevronDownIcon`'s path, moved down a
 * quarter unit so the glyph sits on the middle of its box), pointing down on a line that can
 * fold and turned to point right on a folded one. The title is the one CodeMirror's own marker
 * takes from its default phrases, which Vision does not translate.
 */
function foldMarker(open: boolean): HTMLElement {
  const marker = document.createElement('span')
  marker.className = FOLD_MARKER_CLASS
  marker.dataset.open = String(open)
  marker.title = open ? 'Fold line' : 'Unfold line'

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 25 25')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', 'M17 10.25L12.5 14.75L8 10.25')
  path.setAttribute('stroke', 'currentColor')
  path.setAttribute('stroke-width', '1.2')
  path.setAttribute('stroke-linejoin', 'round')
  svg.append(path)
  marker.append(svg)
  return marker
}

/** Folding for the redesign's editors, with its chevrons and placeholder styled by {@link redesignEditorTheme} */
export const redesignFolding: Extension = foldGutter({markerDOM: foldMarker})

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
      // content's top padding, rather than running up into the label that floats over it. The
      // gutters stick to the left while long lines scroll sideways, so they stay opaque over them.
      // When the pane starts at a fractional offset, Chrome leaves the pixel column at its left
      // edge uncovered, so a shadow in their color covers it; the scroller clips it otherwise.
      '&.cm-editor .cm-gutters': {
        '--vision-fold-icon-size': '17px',
        'backgroundColor': 'var(--card-bg-color)',
        'backgroundImage': 'linear-gradient(var(--card-border-color), var(--card-border-color))',
        'backgroundOrigin': 'border-box',
        'backgroundPosition': 'right bottom',
        'backgroundRepeat': 'no-repeat',
        'backgroundSize': '1px calc(100% - var(--vision-editor-content-padding-top, 0px))',
        'border': 'none',
        'boxShadow': '-1px 0 0 var(--card-bg-color)',
        'color': 'color-mix(in srgb, var(--card-muted-fg-color) 70%, transparent)',
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
      // The fold column is as wide on every line, and each chevron is centered in it and on its
      // line's height, which puts it level with the line number beside it. It is muted like the
      // line numbers and takes the text color under the pointer.
      '&.cm-editor .cm-foldGutter .cm-gutterElement': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'content-box',
        width: 'var(--vision-fold-icon-size)',
        padding: '0 0.25rem 0 0',
      },
      [`&.cm-editor .cm-foldGutter .${FOLD_MARKER_CLASS}`]: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: '0',
        color: 'color-mix(in srgb, var(--card-muted-fg-color) 70%, transparent)',
        cursor: 'pointer',
      },
      [`&.cm-editor .cm-foldGutter .${FOLD_MARKER_CLASS}:hover`]: {
        color: 'var(--card-fg-color)',
      },
      [`&.cm-editor .cm-foldGutter .${FOLD_MARKER_CLASS} svg`]: {
        display: 'block',
        flex: 'none',
        width: 'var(--vision-fold-icon-size)',
        height: 'var(--vision-fold-icon-size)',
      },
      [`&.cm-editor .cm-foldGutter .${FOLD_MARKER_CLASS}[data-open="false"] svg`]: {
        transform: 'rotate(-90deg)',
      },
      // A folded range reads as a subtle pill on the text's baseline, spaced off the brackets on
      // either side of it by the same amount
      '&.cm-editor .cm-foldPlaceholder': {
        display: 'inline-block',
        margin: '0 0.4ch',
        padding: '0 0.9ch',
        border: '1px solid color-mix(in srgb, var(--card-muted-fg-color) 28%, transparent)',
        borderRadius: '999px',
        backgroundColor: 'color-mix(in srgb, var(--card-muted-fg-color) 10%, transparent)',
        color: 'var(--card-muted-fg-color)',
        lineHeight: '1.15',
        verticalAlign: 'baseline',
        cursor: 'pointer',
      },
      '&.cm-editor .cm-foldPlaceholder:hover': {
        borderColor: 'color-mix(in srgb, var(--card-muted-fg-color) 50%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--card-muted-fg-color) 20%, transparent)',
        color: 'var(--card-fg-color)',
      },
      // References to the param being edited in the params pane, marked the same way in the
      // primary tone while focus is in that pane rather than in this editor
      [`&.cm-editor .${PARAM_HIGHLIGHT_CLASS}`]: {
        backgroundColor: 'color-mix(in srgb, var(--card-badge-primary-fg-color) 14%, transparent)',
        borderRadius: '2px',
        boxShadow:
          'inset 0 0 0 1px color-mix(in srgb, var(--card-badge-primary-fg-color) 50%, transparent)',
      },
      // A finding the value of a param causes is fixed in the params, where it is underlined; the
      // reference in the query only gets a dotted line, so it reads as a pointer to the params
      [`&.cm-editor .cm-lintRange.${PARAM_LINT_MARK_CLASS}`]: {
        backgroundImage: 'none',
        textDecorationLine: 'underline',
        textDecorationStyle: 'dotted',
        textDecorationColor: 'color-mix(in srgb, var(--card-muted-fg-color) 70%, transparent)',
        textUnderlineOffset: '3px',
      },
      // Hover tooltips (lint findings, function docs) are padded, sized and raised like the
      // tooltips of Studio itself (`VisionTooltip`) rather than CodeMirror's roomier defaults
      '&.cm-editor .cm-tooltip.cm-tooltip-hover': {
        border: 'none',
        borderRadius: '3px',
        boxShadow: [
          '0 0 0 0.5px var(--card-shadow-outline-color, var(--card-border-color))',
          '0 3px 5px -2px var(--card-shadow-umbra-color, transparent)',
          '0 6px 10px 0 var(--card-shadow-penumbra-color, transparent)',
          '0 1px 18px 1px var(--card-shadow-ambient-color, transparent)',
        ].join(', '),
      },
      '&.cm-editor .cm-tooltip-hover .cm-diagnostic': {
        fontSize: '0.8125rem',
        lineHeight: '1.0625rem',
        marginLeft: 0,
        padding: '4px 8px 4px 6px',
      },
      '&.cm-editor .cm-tooltip-hover .cm-diagnosticSource': {
        lineHeight: '0.875rem',
      },
      '&.cm-editor .cm-tooltip-hover .cm-vision-function-doc': {
        padding: '6px 8px',
      },
    }),
  ),
]

export const redesignParamsExtensions: Extension[] = [
  ...paramsExtensions,
  redesignFolding,
  redesignEditorTheme,
]

export const redesignResultJsonExtensions: Extension[] = [
  ...readOnlyJsonExtensions,
  redesignFolding,
  redesignEditorTheme,
]
