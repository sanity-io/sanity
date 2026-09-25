import {setDiagnostics} from '@codemirror/lint'
import {EditorState} from '@codemirror/state'
import {describe, expect, it, vi} from 'vitest'

import {
  collectFindings,
  groqLintSource,
  renderMessage,
  splitMessage,
  syntaxErrorDiagnostic,
  toDiagnostics,
} from './groqLint'
import * as groqWasm from './groqWasm'

function viewOf(doc: string) {
  return {state: EditorState.create({doc})}
}

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
