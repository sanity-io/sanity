import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {defineConfig, type Tool} from 'sanity'
import {RouterProvider, type RouterState} from 'sanity/router'
import {expect, it} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {router as structureRouter} from '../../../router'
import {type StructureResolver, type StructureToolOptions} from '../../../types'
import {StructureToolBoundary} from '../StructureToolBoundary'

it('reloads only the structure tool after a structure error', async () => {
  let attempts = 0
  const structure: StructureResolver = (S) => () => {
    attempts += 1
    if (attempts === 1) throw new Error('Structure failed')

    return S.list().id('root').title('Recovered content').items([])
  }
  const tool: Tool<StructureToolOptions> = {
    name: 'structure',
    title: 'Structure',
    component: () => null,
    options: {structure},
  }
  const TestProvider = await createTestProvider({
    config: defineConfig({projectId: 'test', dataset: 'test'}),
    resources: [structureUsEnglishLocaleBundle],
  })

  render(
    <TestProvider>
      <StructureToolBoundary tool={tool} />
    </TestProvider>,
  )
  expect(await screen.findByText('Encountered an error while reading structure')).toBeVisible()

  await userEvent.click(screen.getByRole('button', {name: 'Reload'}))

  expect(await screen.findByText('Recovered content')).toBeInTheDocument()
  expect(screen.queryByText('Encountered an error while reading structure')).toBeNull()
})

function createIntentState(id: string): RouterState {
  return {intent: 'edit', params: {id, type: 'book'}}
}

function createTool(structure: StructureResolver): Tool<StructureToolOptions> {
  return {name: 'structure', title: 'Structure', component: () => null, options: {structure}}
}

function renderWithRouterState(
  TestProvider: Awaited<ReturnType<typeof createTestProvider>>,
  tool: Tool<StructureToolOptions>,
  state: RouterState,
) {
  return (
    <TestProvider>
      <RouterProvider router={structureRouter} state={state} onNavigate={() => undefined}>
        <StructureToolBoundary tool={tool} />
      </RouterProvider>
    </TestProvider>
  )
}

async function flushRenders() {
  await act(async () => {
    await Promise.resolve()
  })
  await act(async () => {
    await Promise.resolve()
  })
  await act(async () => {
    await Promise.resolve()
  })
}

it('keeps the error screen when the structure fails while an intent is pending', async () => {
  let attempts = 0
  const tool = createTool(() => () => {
    attempts += 1
    throw new Error('Structure failed')
  })
  const TestProvider = await createTestProvider({
    config: defineConfig({projectId: 'test', dataset: 'test'}),
    resources: [structureUsEnglishLocaleBundle],
  })

  render(renderWithRouterState(TestProvider, tool, createIntentState('book-1')))
  expect(await screen.findByText('Encountered an error while reading structure')).toBeVisible()
  await flushRenders()
  const attemptsAfterError = attempts

  await flushRenders()

  expect(attempts).toBe(attemptsAfterError)
  expect(screen.getByText('Encountered an error while reading structure')).toBeVisible()
})

it('retries after a new navigation once the structure has failed', async () => {
  let attempts = 0
  const tool = createTool((S) => () => {
    attempts += 1
    if (attempts === 1) throw new Error('Structure failed')

    return S.list().id('root').title('Recovered content').items([])
  })
  const TestProvider = await createTestProvider({
    config: defineConfig({projectId: 'test', dataset: 'test'}),
    resources: [structureUsEnglishLocaleBundle],
  })

  const {rerender} = render(renderWithRouterState(TestProvider, tool, createIntentState('book-1')))
  expect(await screen.findByText('Encountered an error while reading structure')).toBeVisible()

  rerender(renderWithRouterState(TestProvider, tool, createIntentState('book-2')))

  expect(await screen.findByText('Recovered content')).toBeInTheDocument()
  expect(screen.queryByText('Encountered an error while reading structure')).toBeNull()
})
