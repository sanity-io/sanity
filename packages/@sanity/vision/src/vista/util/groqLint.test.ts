import {setDiagnostics} from '@codemirror/lint'
import {EditorState} from '@codemirror/state'
import {EditorView} from '@codemirror/view'
import {Schema} from '@sanity/schema'
import {describe, expect, it, vi} from 'vitest'

import {
  functionLibrary,
  type GroqEditorLabels,
  groqEditorLabels,
  querySchema,
} from './groqEditorContext'
import {
  collectFindings,
  groqLintSource,
  renderMessage,
  splitMessage,
  syntaxErrorDiagnostic,
  toDiagnostics,
} from './groqLint'
import * as groqWasm from './groqWasm'
import {createQuerySchema} from './schemaCheck'

const EDITOR_LABELS: GroqEditorLabels = {
  reference: 'GROQ functions reference',
  apiVersion: (version) => `Needs API version ${version} or later`,
  deltaOnly: 'Only in delta mode',
  declaredOn: (line) => `Declared on line ${line}`,
  inLibrary: 'In your library',
  completionDeclared: 'in this query',
  completionLibrary: 'from your library',
  extract: 'Extract to function',
  addFromLibrary: 'Declare it',
  useSuggestion: (suggestion) => `Use ${suggestion}`,
}

function viewOf(doc: string) {
  return {state: EditorState.create({doc})}
}

const SCHEMA = createQuerySchema(
  Schema.compile({
    name: 'test',
    types: [
      {
        name: 'author',
        type: 'document',
        fields: [
          {name: 'name', type: 'string'},
          {name: 'bestFriend', type: 'reference', to: [{type: 'author'}]},
        ],
      },
    ],
  }),
)

describe('schema findings', () => {
  it('lints the types and fields the schema does not have, with an action writing the suggestion', async () => {
    const query = '*[_type == "athor"]{nmae, "f": bestFriend.name}'
    const view = new EditorView({
      state: EditorState.create({
        doc: query,
        extensions: [groqEditorLabels.of(EDITOR_LABELS), querySchema.of(SCHEMA)],
      }),
    })
    const diagnostics = await groqLintSource(view)
    expect(
      diagnostics.map((diagnostic) => [
        query.slice(diagnostic.from, diagnostic.to),
        diagnostic.source,
        diagnostic.severity,
        diagnostic.actions?.map((action) => action.name),
      ]),
    ).toEqual([['"athor"', 'vision/unknown-type', 'warning', ['Use "author"']]])

    // With the type fixed, its fields are checked
    const fixed = diagnostics[0]
    fixed.actions?.[0].apply(view, fixed.from, fixed.to)
    expect(view.state.doc.toString()).toBe('*[_type == "author"]{nmae, "f": bestFriend.name}')
    const next = await groqLintSource(view)
    expect(next.map((diagnostic) => [diagnostic.source, diagnostic.actions?.[0].name])).toEqual([
      ['vision/unknown-field', 'Use name'],
      ['vision/not-a-reference', 'Use ->'],
    ])
    // The dot becomes an arrow, though the diagnostic is on the name after it
    const reference = next[1]
    reference.actions?.[0].apply(view, reference.from, reference.to)
    expect(view.state.doc.toString()).toBe('*[_type == "author"]{nmae, "f": bestFriend->name}')
    view.destroy()
  })

  it('checks nothing against a schema the editor was not given', async () => {
    const query = '*[_type == "athor"]{nmae}'
    expect(
      (await groqLintSource(viewOf(query))).filter((diagnostic) =>
        diagnostic.source?.startsWith('vision/'),
      ),
    ).toEqual([])
  })
})

describe('groqLintSource', () => {
  it('turns groq-lint findings into diagnostics on the offending ranges', async () => {
    const query = '*[_type == "post" && author->name == "x"]{title}'
    const diagnostics = await groqLintSource(viewOf(query))

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toMatchObject({
      severity: 'error',
      source: 'groq-lint/join-in-filter',
    })
    expect(query.slice(diagnostics[0].from, diagnostics[0].to)).toBe('author->')
  })

  it('reports a query that does not parse as a single error', async () => {
    const query = '*[_type == "a"'
    const diagnostics = await groqLintSource(viewOf(query))

    expect(diagnostics).toEqual([
      {
        from: 1,
        to: 14,
        severity: 'error',
        message: "expected ']' following expression",
        source: 'groq',
      },
    ])
  })

  it('has nothing to say about clean queries', async () => {
    expect(await groqLintSource(viewOf('*[_type == "post"]{title}'))).toEqual([])
  })

  it('leaves the wasm alone for a blank document, which every new tab starts as', async () => {
    const lintSpy = vi.spyOn(groqWasm, 'lintGroq')
    expect(await groqLintSource(viewOf(''))).toEqual([])
    expect(await groqLintSource(viewOf('  \n'))).toEqual([])
    expect(lintSpy).not.toHaveBeenCalled()
    lintSpy.mockRestore()
  })

  it('checks custom functions and function calls along with the groq-lint rules', async () => {
    const query = 'fn ex::f($p) = $p{"x": $p.y};\n*{"n": count(), "f": ex::f(@)}'
    const diagnostics = await groqLintSource(viewOf(query))

    expect(
      diagnostics.map((diagnostic) => [
        diagnostic.source,
        query.slice(diagnostic.from, diagnostic.to),
      ]),
    ).toEqual([
      ['vision/parameter-reuse', '$p'],
      ['vision/arity', 'count'],
    ])
    const rendered = diagnostics[1].renderMessage?.(new EditorView())
    expect(rendered).toBeDefined()
    const container = document.createElement('div')
    container.append(rendered ?? '')
    expect(container.innerHTML).toBe('<code>count()</code> takes one argument, not 0')
  })

  it('says what is wrong with a declaration the parser rejects', async () => {
    const [diagnostic] = await groqLintSource(viewOf('fn foo($p) = $p{name}; *'))
    expect(diagnostic).toMatchObject({
      severity: 'error',
      source: 'groq',
      message: 'Custom functions need a namespace of their own: `fn my::foo(…)`',
    })
  })

  it('offers to declare a library function the query calls without declaring it', async () => {
    const library = [{id: 'ex::author', declaration: 'fn ex::author($ref) = $ref->{name}'}]
    const view = new EditorView({
      state: EditorState.create({
        doc: '*{"author": ex::author(author)}',
        extensions: [functionLibrary.of(library), groqEditorLabels.of(EDITOR_LABELS)],
      }),
    })
    const [diagnostic] = await groqLintSource(view)

    expect(diagnostic.source).toBe('vision/unknown-function')
    expect(diagnostic.actions?.map((action) => action.name)).toEqual(['Declare it'])
    diagnostic.actions?.[0].apply(view, diagnostic.from, diagnostic.to)
    expect(view.state.doc.toString()).toBe(
      'fn ex::author($ref) = $ref->{name};\n\n*{"author": ex::author(author)}',
    )
    view.destroy()
  })

  it('still checks the functions of a query that parses when the wasm cannot be loaded', async () => {
    const lintSpy = vi.spyOn(groqWasm, 'lintGroq').mockRejectedValue(new Error('offline'))
    expect(
      (await groqLintSource(viewOf('*{"n": count()}'))).map((diagnostic) => diagnostic.source),
    ).toEqual(['vision/arity'])
    expect(await groqLintSource(viewOf('*{"n": count(}'))).toEqual([])
    lintSpy.mockRestore()
  })
})

describe('toDiagnostics', () => {
  it('clamps ranges to the document and never lets `to` precede `from`', () => {
    const [first, second] = toDiagnostics(
      [
        {ruleId: 'large-pages', message: 'Large page', severity: 'warning', from: 2, to: 99},
        {ruleId: 'match-on-id', message: 'Match on id', severity: 'info', from: 8, to: 3},
      ],
      10,
    )
    expect([first.from, first.to, first.severity]).toEqual([2, 10, 'warning'])
    expect([second.from, second.to, second.severity]).toEqual([8, 8, 'info'])
  })
})

describe('collectFindings', () => {
  it('lists the editor diagnostics with their line and column', () => {
    const doc = '*[_type == "post"\n  && author->name == "x"]'
    let state = EditorState.create({doc})
    state = state.update(
      setDiagnostics(state, [
        {
          from: doc.indexOf('author->'),
          to: doc.indexOf('author->') + 'author->'.length,
          severity: 'error',
          message: 'Avoid joins',
          source: 'groq-lint/join-in-filter',
        },
        {from: 0, to: 1, severity: 'info', message: 'Everything'},
      ]),
    ).state

    expect(collectFindings(state)).toEqual([
      {
        from: 0,
        to: 1,
        line: 1,
        column: 1,
        severity: 'info',
        message: 'Everything',
        source: undefined,
      },
      {
        from: 23,
        to: 31,
        line: 2,
        column: 6,
        severity: 'error',
        message: 'Avoid joins',
        source: 'groq-lint/join-in-filter',
      },
    ])
  })
})

describe('splitMessage', () => {
  it('marks the backtick-quoted segments as code', () => {
    expect(splitMessage('Avoid `->` in filters; write `count(*[])`.')).toEqual([
      {text: 'Avoid ', code: false},
      {text: '->', code: true},
      {text: ' in filters; write ', code: false},
      {text: 'count(*[])', code: true},
      {text: '.', code: false},
    ])
    expect(splitMessage('plain')).toEqual([{text: 'plain', code: false}])
  })
})

describe('renderMessage', () => {
  it('renders the backtick-quoted GROQ as inline code', () => {
    const container = document.createElement('div')
    container.append(renderMessage('Avoid `->` in filters; write `count(*[])` instead.'))

    expect(container.innerHTML).toBe(
      'Avoid <code>-&gt;</code> in filters; write <code>count(*[])</code> instead.',
    )
    expect(container.textContent).toBe('Avoid -> in filters; write count(*[]) instead.')
  })
})

describe('syntaxErrorDiagnostic', () => {
  it('keeps the parser message and clamps the range', () => {
    expect(syntaxErrorDiagnostic(new groqWasm.GroqSyntaxError('unexpected end', 4, 20), 6)).toEqual(
      {
        from: 4,
        to: 6,
        severity: 'error',
        message: 'unexpected end',
        source: 'groq',
      },
    )
  })
})
