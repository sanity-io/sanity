import {act, render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ComponentType, type PropsWithChildren} from 'react'
import {defineConfig, type Tool} from 'sanity'
import {RouterProvider, type RouterState} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {router} from '../../../router'
import {type StructureResolver, type StructureToolOptions} from '../../../types'
import {StructureToolBoundary} from '../StructureToolBoundary'

const STRUCTURE_ERROR_HEADING = 'Encountered an error while reading structure'

// the first render loads the structure tool's lazy modules, which can outlast the default timeout
describe('StructureToolBoundary', {timeout: 20_000}, () => {
  let attempts: number
  let tool: Tool<StructureToolOptions>
  let TestProvider: ComponentType<PropsWithChildren>

  beforeEach(async () => {
    attempts = 0
    const structure: StructureResolver = (S) => () => {
      attempts += 1
      if (attempts === 1) throw new Error('Structure failed')

      return S.list().id('root').title('Recovered content').items([])
    }
    tool = {
      name: 'structure',
      title: 'Structure',
      component: () => null,
      options: {structure},
    }
    TestProvider = await createTestProvider({
      config: defineConfig({projectId: 'test', dataset: 'test'}),
      resources: [structureUsEnglishLocaleBundle],
    })
  })

  const onNavigate = vi.fn<(navigation: {path: string; replace?: boolean}) => void>()

  function studioAtRouterState(routerState: RouterState) {
    return (
      <TestProvider>
        <RouterProvider router={router} state={routerState} onNavigate={onNavigate}>
          <StructureToolBoundary tool={tool} />
        </RouterProvider>
      </TestProvider>
    )
  }

  it('reloads only the structure tool after a structure error', async () => {
    render(studioAtRouterState({}))
    expect(await screen.findByText(STRUCTURE_ERROR_HEADING)).toBeVisible()

    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the reload renders the list pane for the first time, which suspends until its chunk has loaded, and React only resumes work that suspended inside an awaited async `act`
    await act(async () => {
      await userEvent.click(screen.getByRole('button', {name: 'Reload'}))
    })

    expect(await screen.findByText('Recovered content')).toBeInTheDocument()
    expect(screen.queryByText(STRUCTURE_ERROR_HEADING)).toBeNull()
  })

  it('retries the structure tool when an intent is navigated to after a structure error', async () => {
    const {rerender} = render(studioAtRouterState({panes: [[{id: 'broken-child'}]]}))
    expect(await screen.findByText(STRUCTURE_ERROR_HEADING)).toBeVisible()

    rerender(
      studioAtRouterState({intent: 'edit', params: {id: 'recovered-document', type: 'author'}}),
    )

    expect(screen.queryByText(STRUCTURE_ERROR_HEADING)).toBeNull()
    await waitFor(() =>
      expect(onNavigate).toHaveBeenCalledWith(
        expect.objectContaining({path: expect.stringContaining('recovered-document')}),
      ),
    )
  })

  it('retries the structure tool when an intent is navigated to after an async child resolver fails', async () => {
    const structure: StructureResolver = (S) =>
      S.list()
        .id('root')
        .title('Recovered content')
        .items([
          S.listItem()
            .id('anchor')
            .title('Anchor')
            .child(
              S.list()
                .id('anchor')
                .title('Anchor')
                .items([])
                .child(async () => {
                  throw new Error('Failed to resolve document')
                }),
            ),
        ])
    tool = {...tool, options: {structure}}
    const {rerender} = render(
      studioAtRouterState({panes: [[{id: 'anchor'}], [{id: 'nonexistent-child'}]]}),
    )
    expect(await screen.findByText(STRUCTURE_ERROR_HEADING)).toBeVisible()

    rerender(
      studioAtRouterState({intent: 'edit', params: {id: 'recovered-document', type: 'author'}}),
    )

    expect(screen.queryByText(STRUCTURE_ERROR_HEADING)).toBeNull()
    await waitFor(() =>
      expect(onNavigate).toHaveBeenCalledWith(
        expect.objectContaining({path: expect.stringContaining('recovered-document')}),
      ),
    )
  })

  it('retries the structure tool when the panes change after a structure error', async () => {
    const {rerender} = render(studioAtRouterState({panes: [[{id: 'broken-child'}]]}))
    expect(await screen.findByText(STRUCTURE_ERROR_HEADING)).toBeVisible()

    rerender(studioAtRouterState({panes: []}))

    expect(await screen.findByText('Recovered content')).toBeInTheDocument()
    expect(screen.queryByText(STRUCTURE_ERROR_HEADING)).toBeNull()
  })

  it('keeps the structure error when the router state changes without navigating', async () => {
    const panes = [[{id: 'broken-child'}]]
    const {rerender} = render(studioAtRouterState({panes}))
    expect(await screen.findByText(STRUCTURE_ERROR_HEADING)).toBeVisible()

    rerender(studioAtRouterState({panes, _searchParams: [['perspective', 'drafts']]}))

    expect(screen.getByText(STRUCTURE_ERROR_HEADING)).toBeVisible()
    expect(attempts).toBe(1)
  })

  it('keeps the error screen when the structure fails while an intent is pending', async () => {
    const failingStructure: StructureResolver = () => () => {
      attempts += 1
      throw new Error('Structure failed')
    }
    tool = {...tool, options: {structure: failingStructure}}
    const intentState: RouterState = {
      intent: 'edit',
      params: {id: 'pending-document', type: 'author'},
    }
    render(studioAtRouterState(intentState))
    expect(await screen.findByText(STRUCTURE_ERROR_HEADING)).toBeVisible()
    const attemptsAfterError = attempts

    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))

    expect(attempts).toBe(attemptsAfterError)
    expect(onNavigate).not.toHaveBeenCalled()
    expect(screen.getByText(STRUCTURE_ERROR_HEADING)).toBeVisible()
  })
})
