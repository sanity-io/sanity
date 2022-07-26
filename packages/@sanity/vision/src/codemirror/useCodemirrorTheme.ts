import {rem, Theme} from '@sanity/ui'
import {EditorView} from '@codemirror/view'
import {HighlightStyle, syntaxHighlighting} from '@codemirror/language'
import {useMemo} from 'react'
import {hues} from '@sanity/color'
import {tags as t} from '@lezer/highlight'

export function useCodemirrorTheme(theme: Theme) {
  const cmTheme = useMemo(() => createTheme(theme), [theme])
  const cmHighlight = useMemo(() => syntaxHighlighting(createHighlight(theme)), [theme])

  return [cmTheme, cmHighlight]
}

function createTheme(theme: Theme) {
  const {color, fonts} = theme.sanity
  const card = color.card.enabled
  const cursor = hues.blue[color.dark ? 400 : 500].hex
  const selection = hues.gray[theme.sanity.color.dark ? 900 : 100].hex

  return EditorView.theme(
    {
      '&': {
        color: card.fg,
        backgroundColor: card.bg,
      },

      '.cm-content': {
        caretColor: cursor,
      },

      '.cm-editor': {
        fontFamily: fonts.code.family,
        fontSize: rem(fonts.code.sizes[1].fontSize),
        lineHeight: 'inherit',
      },

      '.cm-cursor, .cm-dropCursor': {borderLeftColor: cursor},
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: selection,
      },

      '.cm-panels': {backgroundColor: card.bg, color: card.fg},
      '.cm-panels.cm-panels-top': {borderBottom: `2px solid ${card.border}`},
      '.cm-panels.cm-panels-bottom': {borderTop: `2px solid ${card.border}`},
    },
    {dark: color.dark}
  )
}

function createHighlight(theme: Theme) {
  const c = theme.sanity.color.base
  const s = theme.sanity.color.syntax
  return HighlightStyle.define([
    {tag: t.keyword, color: s.keyword},
    {tag: [t.propertyName, t.name, t.deleted, t.character, t.macroName], color: s.property},
    {tag: [t.function(t.variableName), t.labelName], color: s.function},
    {tag: [t.color, t.constant(t.name), t.standard(t.name)], color: s.variable},
    {tag: [t.definition(t.name), t.separator], color: s.constant},
    {
      tag: [
        t.typeName,
        t.className,
        t.number,
        t.changed,
        t.annotation,
        t.modifier,
        t.self,
        t.namespace,
      ],
      color: s.number,
    },
    {
      tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
      color: s.operator,
    },
    {tag: [t.meta, t.comment], color: s.comment},
    {tag: t.strong, fontWeight: 'bold'},
    {tag: t.emphasis, fontStyle: 'italic'},
    {tag: t.strikethrough, textDecoration: 'line-through'},
    {tag: t.heading, fontWeight: 'bold', color: s.property},
    {tag: [t.atom, t.bool, t.special(t.variableName)], color: s.boolean},
    {tag: [t.processingInstruction, t.string, t.inserted], color: s.string},
    {tag: t.invalid, color: c.fg},
  ])
}
