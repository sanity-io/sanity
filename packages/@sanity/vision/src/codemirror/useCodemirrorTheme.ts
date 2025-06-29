import {HighlightStyle, syntaxHighlighting} from '@codemirror/language'
import {EditorView} from '@codemirror/view'
import {tags as t} from '@lezer/highlight'
import {vars} from '@sanity/ui/css'
import {useMemo} from 'react'

export function useCodemirrorTheme() {
  const cmTheme = useMemo(() => createTheme(), [])
  const cmHighlight = useMemo(() => syntaxHighlighting(createHighlight()), [])

  return [cmTheme, cmHighlight]
}

function createTheme() {
  return EditorView.theme({})
}

function createHighlight() {
  const s = vars.color.code.token

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
    {tag: t.invalid, color: vars.color.code.fg},
  ])
}
