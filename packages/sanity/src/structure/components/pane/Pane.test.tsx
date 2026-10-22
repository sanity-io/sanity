import {render, screen} from '@testing-library/react'
import {PaneLayoutContext} from 'sanity/_singletons'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {Pane} from './Pane'
import {type PaneLayoutContextValue} from './types'

function createPaneLayoutValue(collapsed: boolean): PaneLayoutContextValue {
  return {
    collapse: () => {},
    collapsed,
    expand: () => {},
    expandedElement: null,
    mount: () => () => {},
    resize: () => {},
    resizing: false,
    panes: [],
  }
}

describe('Pane', () => {
  it('does not render children when initially layout-collapsed and not the last pane', async () => {
    const wrapper = await createTestProvider()

    render(
      <PaneLayoutContext.Provider value={createPaneLayoutValue(true)}>
        <Pane id="test-pane">
          <div data-testid="pane-children" />
        </Pane>
      </PaneLayoutContext.Provider>,
      {wrapper},
    )

    expect(screen.queryByTestId('pane-children')).toBeNull()
  })

  it('keeps children mounted but hidden when the layout collapses', async () => {
    const wrapper = await createTestProvider()

    const {rerender} = render(
      <PaneLayoutContext.Provider value={createPaneLayoutValue(false)}>
        <Pane id="test-pane">
          <div data-testid="pane-children" />
        </Pane>
      </PaneLayoutContext.Provider>,
      {wrapper},
    )

    expect(screen.getByTestId('pane-children')).toBeVisible()

    rerender(
      <PaneLayoutContext.Provider value={createPaneLayoutValue(true)}>
        <Pane id="test-pane">
          <div data-testid="pane-children" />
        </Pane>
      </PaneLayoutContext.Provider>,
    )

    expect(screen.getByTestId('pane-children')).not.toBeVisible()

    rerender(
      <PaneLayoutContext.Provider value={createPaneLayoutValue(false)}>
        <Pane id="test-pane">
          <div data-testid="pane-children" />
        </Pane>
      </PaneLayoutContext.Provider>,
    )

    expect(screen.getByTestId('pane-children')).toBeVisible()
  })
})
