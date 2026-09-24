import {render} from '@testing-library/react'
import {useContext, useEffect} from 'react'
import {PaneLayoutContext, PaneRouterContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type PaneLayoutContextValue} from '../../pane/types'
import {PaneRouterProvider} from '../PaneRouterProvider'
import {type PaneRouterContextValue} from '../types'

const {mockNavigate, routerState} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  routerState: {panes: [[{id: 'articles'}], [{id: 'article'}]]},
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({navigate: mockNavigate}),
  useRouterState: () => routerState,
}))

const elements = Array.from({length: 4}, () => document.createElement('div'))
const expand = vi.fn()
const params = {}

function paneLayout(paneCount: number, flex: number): PaneLayoutContextValue {
  return {
    collapse: vi.fn(),
    expand,
    expandedElement: null,
    mount: vi.fn(),
    panes: elements
      .slice(0, paneCount)
      .map((element) => ({element, collapsed: false, flex, maximized: false})),
    resize: vi.fn(),
    resizing: false,
  }
}

function RouterContextLog({log}: {log: PaneRouterContextValue[]}) {
  const value = useContext(PaneRouterContext)
  useEffect(() => {
    log.push(value)
  }, [log, value])
  return null
}

function Harness({layout, log}: {layout: PaneLayoutContextValue; log: PaneRouterContextValue[]}) {
  return (
    <PaneLayoutContext.Provider value={layout}>
      <PaneRouterProvider
        flatIndex={2}
        index={2}
        params={params}
        payload={undefined}
        siblingIndex={0}
      >
        <RouterContextLog log={log} />
      </PaneRouterProvider>
    </PaneLayoutContext.Provider>
  )
}

describe('PaneRouterProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps its context value when only pane sizes change', () => {
    const log: PaneRouterContextValue[] = []
    const {rerender} = render(<Harness layout={paneLayout(3, 1)} log={log} />)
    rerender(<Harness layout={paneLayout(3, 0.8)} log={log} />)

    expect(log).toHaveLength(1)
  })

  it('expands the pane before the last one when closing the current pane and those after it', () => {
    const log: PaneRouterContextValue[] = []
    const {rerender} = render(<Harness layout={paneLayout(3, 1)} log={log} />)
    rerender(<Harness layout={paneLayout(4, 1)} log={log} />)
    log.at(-1)?.closeCurrentAndAfter()

    expect(expand).toHaveBeenCalledWith(elements[2])
    expect(mockNavigate).toHaveBeenCalledWith({panes: [[{id: 'articles'}]]})
  })
})
