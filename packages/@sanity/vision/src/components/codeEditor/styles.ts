import {hues} from '@sanity/color'
import {rem, responsiveCodeFontStyle, Theme} from '@sanity/ui'
import {css} from 'styled-components'

export function codeEditorStyle(props: {theme: Theme}) {
  const {theme} = props
  const {space} = theme.sanity
  const {dark} = theme.sanity.color

  return css`
    vertical-align: top;
    height: 100%;
    color: var(--card-code-fg-color);

    &::selection {
      background: none;
    }

    &::-moz-selection {
      background: none;
    }

    & > .react-codemirror2 {
      ${responsiveCodeFontStyle}
      height: 100%;
      box-sizing: border-box;
      transform: none;
    }

    & .CodeMirror {
      background: none;
      font: inherit;
      color: inherit;
      height: 100%;
    }

    /* Scroll */
    & .CodeMirror-scroll {
      margin: 0;
      box-sizing: border-box;
      padding: ${rem(space[3])} 0;
    }

    /* Selection */
    & .CodeMirror-selected {
      background: ${hues.gray[dark ? 900 : 100].hex} !important;
    }
    & .CodeMirror-focused .CodeMirror-selected {
      background: ${hues.blue[dark ? 900 : 100].hex} !important;
    }
    & .CodeMirror-line::selection,
    & .CodeMirror-line > span::selection,
    & .CodeMirror-line > span > span::selection {
      background: none !important;
    }
    & .CodeMirror-line::-moz-selection,
    & .CodeMirror-line > span::-moz-selection,
    & .CodeMirror-line > span > span::-moz-selection {
      background: none !important;
    }

    /* Cursor */
    & .CodeMirror-cursor {
      border-color: ${hues.blue[dark ? 400 : 500].hex};
      border-left-width: 2px;
    }

    /* Line */
    & .CodeMirror pre.CodeMirror-line,
    & .CodeMirror pre.CodeMirror-line-like {
      padding: 0 ${rem(space[4])};
    }

    /* Sizer */
    & .CodeMirror-sizer {
      border-right-width: ${rem(space[4])} !important;
    }
  `
}

export function codeEditorSyntax(props: {theme: Theme}) {
  const {theme} = props
  const {dark, syntax} = theme.sanity.color

  return css`
    & .cm-s-default .cm-header {
      color: ${hues.blue[dark ? 400 : 700].hex};
    }
    & .cm-s-default .cm-quote {
      color: ${hues.green[dark ? 400 : 700].hex};
    }
    & .cm-negative {
      color: ${hues.red[dark ? 400 : 700].hex};
    }
    & .cm-positive {
      color: ${hues.green[dark ? 400 : 700].hex};
    }
    & .cm-header,
    & .cm-strong {
      font-weight: 700;
    }
    & .cm-em {
      font-style: italic;
    }
    & .cm-link {
      text-decoration: underline;
    }
    & .cm-strikethrough {
      text-decoration: line-through;
    }
    & .cm-s-default .cm-keyword {
      color: ${syntax.keyword};
    }
    & .cm-s-default .cm-atom {
      color: ${syntax.boolean};
    }
    & .cm-s-default .cm-number {
      color: ${syntax.number};
    }
    & .cm-s-default .cm-def {
      color: ${syntax.function};
    }
    & .cm-s-default .cm-variable {
      color: ${syntax.builtin};
    }
    & .cm-s-default .cm-punctuation {
    }
    & .cm-s-default .cm-property {
      color: ${syntax.property};
    }
    & .cm-s-default .cm-operator {
      color: ${syntax.operator};
    }
    & .cm-s-default .cm-variable-2 {
      color: ${hues.cyan[dark ? 400 : 700].hex};
    }
    & .cm-s-default .cm-variable-3,
    & .cm-s-default .cm-type {
      color: ${hues.cyan[dark ? 400 : 700].hex};
    }
    & .cm-s-default .cm-comment {
      color: ${syntax.comment};
    }
    & .cm-s-default .cm-string {
      color: ${syntax.string};
    }
    & .cm-s-default .cm-string-2 {
      color: ${hues.orange[dark ? 400 : 700].hex};
    }
    & .cm-s-default .cm-meta {
      color: ${hues.gray[dark ? 400 : 700].hex};
    }
    & .cm-s-default .cm-qualifier {
      color: ${hues.gray[dark ? 400 : 700].hex};
    }
    & .cm-s-default .cm-builtin {
      color: ${hues.purple[dark ? 400 : 700].hex};
    }
    & .cm-s-default .cm-bracket {
      color: ${hues.gray[dark ? 400 : 700].hex};
    }
    & .cm-s-default .cm-tag {
      color: ${syntax.className};
    }
    & .cm-s-default .cm-tag.cm-bracket {
      color: inherit;
    }
    & .cm-s-default .cm-attribute {
      color: ${syntax.attrName};
    }
    & .cm-s-default .cm-hr {
      color: ${hues.gray[dark ? 400 : 700].hex};
    }
    & .cm-s-default .cm-link {
      color: ${hues.blue[dark ? 400 : 700].hex};
    }
    & .cm-s-default .cm-error {
      color: ${hues.red[dark ? 400 : 700].hex};
    }
    & .cm-invalidchar {
      color: ${hues.red[dark ? 400 : 700].hex};
    }
    & .CodeMirror-composing {
      border-bottom: 2px solid;
    }

    /* Default styles for common addons */
    & div.CodeMirror span.CodeMirror-matchingbracket {
      color: ${hues.green[dark ? 400 : 700].hex};
    }
    & div.CodeMirror span.CodeMirror-nonmatchingbracket {
      color: ${hues.red[dark ? 400 : 700].hex};
    }
    & .CodeMirror-matchingtag {
      background-color: ${hues.orange[dark ? 800 : 200].hex};
    }
    & .CodeMirror-activeline-background {
      background-color: ${hues.red[dark ? 800 : 200].hex};
    }
  `
}
