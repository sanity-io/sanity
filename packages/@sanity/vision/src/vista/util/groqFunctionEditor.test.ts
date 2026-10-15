import {type Completion, CompletionContext} from '@codemirror/autocomplete'
import {EditorSelection, EditorState} from '@codemirror/state'
import {EditorView, showTooltip} from '@codemirror/view'
import {groq} from '@sanity/lezer-groq'
import {afterEach, describe, expect, it} from 'vitest'

import {type VistaSavedFunction} from '../store/types'
import {functionLibrary, type GroqEditorLabels, groqEditorLabels} from './groqEditorContext'
import {
  createGroqFunctionExtensions,
  extractSelectionToFunction,
  functionCompletions,
  functionHoverAt,
} from './groqFunctionEditor'

const LABELS: GroqEditorLabels = {
  reference: 'GROQ functions reference',
  apiVersion: (version) => `Needs API version ${version} or later`,
  deltaOnly: 'Only in delta mode',
  declaredOn: (line) => `Declared on line ${line}`,
  inLibrary: 'In your library',
  completionDeclared: 'in this query',
  completionLibrary: 'from your library',
  extract: 'Extract to function',
  addFromLibrary: 'Declare it',
}

const LIBRARY: VistaSavedFunction[] = [
  {id: 'ex::author', declaration: 'fn ex::author($ref) = $ref->{name}'},
  {id: 'ex::tags', declaration: 'fn ex::tags($tags) = $tags[]->{title}'},
]

function stateOf(doc: string, selection?: EditorSelection, library = LIBRARY) {
  return EditorState.create({
    doc,
    selection,
    extensions: [groq(), groqEditorLabels.of(LABELS), functionLibrary.of(library)],
  })
}

const views: EditorView[] = []
function viewOf(state: EditorState): EditorView {
  const view = new EditorView({state, parent: document.body})
  views.push(view)
  return view
}
afterEach(() => {
  for (const view of views.splice(0)) view.destroy()
})

function hoverText(doc: string, at: string, offset = 1): string | null {
  const state = stateOf(doc)
  const tooltip = functionHoverAt(state, doc.indexOf(at) + offset, 1)
  if (!tooltip) return null
  return tooltip.create(viewOf(state)).dom.textContent
}

function complete(doc: string, options: {explicit?: boolean; pos?: number} = {}) {
  const state = stateOf(doc)
  return functionCompletions(
    new CompletionContext(state, options.pos ?? doc.length, options.explicit ?? false),
  )
}

function labelsOf(result: ReturnType<typeof complete>): string[] | null {
  return result ? result.options.map((option) => option.label) : null
}

describe('functionHoverAt', () => {
  const query =
    'fn ex::self($p) = $p{x};\n*{"n": count(tags), "t": pt::text(body), "s": ex::self(@), "a": ex::author(author), "u": nope(1)}'

  it('documents built-in functions, with the API version they need and the reference', () => {
    expect(hoverText(query, 'count')).toBe(
      'count(<array>) <integer>Returns the number of elements in an array: count(*[_type == "movie"]).GROQ functions reference',
    )
    expect(hoverText(query, 'pt::text')).toContain('Needs API version v2021-03-25 or later')
    // Over the namespace as well as the name
    expect(hoverText(query, 'pt::text', 3)).toContain('pt::text(<Portable Text array|object>)')
  })

  it('shows the declaration of a custom function and of a library function', () => {
    expect(hoverText(query, 'ex::self(@)')).toBe('fn ex::self($p) = $p{x}Declared on line 1')
    expect(hoverText(query, 'ex::author')).toBe('fn ex::author($ref) = $ref->{name}In your library')
  })

  it('has nothing for arguments, declarations and unknown functions', () => {
    expect(hoverText(query, 'tags')).toBeNull()
    expect(hoverText(query, 'ex::self($p)')).toBeNull()
    expect(hoverText(query, 'nope')).toBeNull()
  })
})

describe('functionCompletions', () => {
  it('offers the functions whose name starts with what is typed, without filtering them fuzzily', () => {
    // With or without its namespace
    expect(labelsOf(complete('*{"n": co'))).toEqual([
      'coalesce',
      'count',
      'array::compact',
      'geo::contains',
    ])
    expect(labelsOf(complete('*{"n": pt::'))).toEqual(['pt::text'])
    expect(complete('*{"n": name')).toBeNull()
    expect(labelsOf(complete('*{"s": startsW'))).toEqual(['string::startsWith'])
    expect(complete('*{"n": co')?.filter).toBe(false)
  })

  it('offers only the pipe functions after `|`, and none of them elsewhere', () => {
    expect(labelsOf(complete('* | or'))).toEqual(['order'])
    expect(labelsOf(complete('* | sc'))).toEqual(['score'])
    expect(complete('*{"o": or')).toBeNull()
    // `||` is no pipe
    expect(labelsOf(complete('*[a || co'))).toContain('count')
  })

  it('waits for two characters unless asked, and stays out of strings, attributes and names', () => {
    expect(complete('*{"n": c')).toBeNull()
    expect(labelsOf(complete('*{"n": c', {explicit: true}))).toContain('count')
    expect(complete('*[_type == "co')).toBeNull()
    expect(complete('*{"n": author.co')).toBeNull()
    expect(complete('*{"n": $co')).toBeNull()
    expect(complete('fn ex::co')).toBeNull()
    expect(complete('// co')).toBeNull()
  })

  it('offers the declared functions first, then the library functions the query lacks', () => {
    const doc = 'fn ex::author($a) = $a->{name};\n*{"a": ex::'
    const result = complete(doc)
    expect(result?.options.map((option) => [option.label, option.detail])).toEqual([
      ['ex::author', 'in this query'],
      ['ex::tags', 'from your library'],
    ])
  })

  it('declares a library function when its completion is picked', () => {
    const doc = 'fn ex::author($a) = $a->{name};\n*{"t": ex::ta'
    const state = stateOf(doc)
    const result = functionCompletions(new CompletionContext(state, doc.length, false))
    const tags = result?.options.find((option) => option.label === 'ex::tags') as Completion
    const view = viewOf(state)
    if (typeof tags.apply !== 'function') throw new Error('The library completion declares itself')
    tags.apply(view, tags, result!.from, doc.length)

    expect(view.state.doc.toString()).toBe(
      'fn ex::author($a) = $a->{name};\nfn ex::tags($tags) = $tags[]->{title};\n*{"t": ex::tags()',
    )
    expect(view.state.doc.toString().slice(0, view.state.selection.main.head)).toMatch(
      /ex::tags\($/,
    )
  })

  it('puts a library function first in a query without declarations', () => {
    const doc = 'ex::au'
    const state = stateOf(doc)
    const result = functionCompletions(new CompletionContext(state, doc.length, false))
    const author = result?.options.find((option) => option.label === 'ex::author') as Completion
    const view = viewOf(state)
    if (typeof author.apply !== 'function')
      throw new Error('The library completion declares itself')
    author.apply(view, author, 0, doc.length)

    expect(view.state.doc.toString()).toBe('fn ex::author($ref) = $ref->{name};\n\nex::author()')
    expect(view.state.selection.main.head).toBe(view.state.doc.length - 1)
  })
})

describe('extracting a function', () => {
  const query = '*[_type == "post"]{title, author->{name}}'
  const selected = EditorSelection.single(
    query.indexOf('author->'),
    query.indexOf('author->') + 'author->{name}'.length,
  )

  it('turns the selected projection into a function, leaving the cursor after the call', () => {
    const view = viewOf(stateOf(query, selected, []))
    expect(extractSelectionToFunction(view)).toBe(true)
    const doc = view.state.doc.toString()
    expect(doc).toBe(
      'fn my::author($author) = $author->{name};\n\n*[_type == "post"]{title, "author": my::author(author)}',
    )
    expect(doc.slice(0, view.state.selection.main.head)).toMatch(/my::author\(author\)$/)
  })

  it('names the function clear of the library, in its namespace', () => {
    const view = viewOf(stateOf(query, selected))
    expect(extractSelectionToFunction(view)).toBe(true)
    expect(view.state.doc.toString()).toContain('fn ex::author2($author) = $author->{name};')
  })

  it('does nothing for a selection that cannot become a function', () => {
    const view = viewOf(stateOf(query, EditorSelection.single(0, 1)))
    expect(extractSelectionToFunction(view)).toBe(false)
    expect(view.state.doc.toString()).toBe(query)
  })

  it('shows a button over a selection that can become a function', () => {
    const extensions = [groq(), ...createGroqFunctionExtensions(LABELS)]
    const withButton = EditorState.create({doc: query, selection: selected, extensions})
    const tooltips = withButton.facet(showTooltip).filter(Boolean)
    expect(tooltips.map((tooltip) => tooltip?.pos)).toEqual([selected.main.from])

    const view = viewOf(withButton)
    const dom = tooltips[0]!.create(view).dom
    const button = dom.querySelector('button')
    expect(button?.textContent).toBe('Extract to function')
    button?.click()
    expect(view.state.doc.toString()).toContain('fn my::author($author)')

    const without = EditorState.create({
      doc: query,
      selection: EditorSelection.single(0, 1),
      extensions,
    })
    expect(without.facet(showTooltip).filter(Boolean)).toEqual([])
  })
})
