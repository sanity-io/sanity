import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {ResultView} from './ResultView'

vi.mock('sanity', () => ({useDataset: () => 'test'}))
vi.mock('sanity/router', () => ({
  IntentLink: (props: {children: ReactNode}) => <a data-testid="intent-link">{props.children}</a>,
}))

// @sanity/ui's ThemeProvider reads the color scheme preference
vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

const theme = buildTheme()
const data = [{_id: 'a', author: {name: 'Ada'}}]

function renderResult(datasetName: string) {
  return render(
    <ThemeProvider theme={theme}>
      <ResultView data={data} datasetName={datasetName} />
    </ThemeProvider>,
  )
}

describe('ResultView', () => {
  afterEach(() => cleanup())

  it("links document IDs when the result is from the workspace's dataset", () => {
    renderResult('test')
    expect(screen.getAllByTestId('intent-link')).toHaveLength(1)
  })

  it('does not link document IDs from another dataset', () => {
    renderResult('other')
    expect(screen.queryAllByTestId('intent-link')).toHaveLength(0)
  })
})
