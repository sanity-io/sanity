import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import noop from 'lodash-es/noop.js'
import {ReplaySubject} from 'rxjs'
import {defineConfig} from 'sanity'
import {route, RouterProvider} from 'sanity/router'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {type ItemChild} from '../../../structureBuilder/ChildResolver'
import {type StructureBuilder} from '../../../structureBuilder/types'
import {StructureToolProvider} from '../../../StructureToolProvider'
import {type RouterPanes, type StructureResolver} from '../../../types'
import {StructureTool} from '../StructureTool'

// The document pane needs the document store and the form; the pane identity is what is
// under test here, so every pane renders a placeholder and documents an uncontrolled input.
vi.mock('../../../panes/StructureToolPane', () => ({
  StructureToolPane: ({pane}: {pane: {type: string}}) =>
    pane.type === 'document' ? (
      <input aria-label="Title" />
    ) : (
      <div data-testid={`pane-${pane.type}`} />
    ),
}))

function createSlowStructure() {
  const root = new ReplaySubject<unknown>(1)
  const pages = new ReplaySubject<ItemChild>(1)
  let builder: StructureBuilder | undefined
  const structure: StructureResolver = (S) => {
    builder = S
    return root.asObservable()
  }

  return {
    structure,
    releaseRoot: () => {
      const S = builder!
      root.next(
        S.list()
          .id('content')
          .title('Content')
          .items([
            S.listItem()
              .id('pages')
              .title('Pages')
              .child(() => pages.asObservable()),
          ]),
      )
    },
    releasePages: () => {
      pages.next(builder!.documentTypeList('page').id('pages-list').apiVersion('2024-01-01'))
    },
  }
}

async function renderStructureTool(structure: StructureResolver, panes: RouterPanes) {
  const TestProvider = await createTestProvider({
    config: defineConfig({
      projectId: 'test',
      dataset: 'test',
      schema: {
        types: [{name: 'page', type: 'document', fields: [{name: 'title', type: 'string'}]}],
      },
    }),
    resources: [structureUsEnglishLocaleBundle],
  })
  const router = route.create('/', [route.intents('/intent')])
  const ui = (routerPanes: RouterPanes) => (
    <TestProvider>
      <RouterProvider router={router} state={{panes: routerPanes}} onNavigate={noop}>
        <StructureToolProvider structure={structure}>
          <StructureTool onPaneChange={noop} toolName="structure" />
        </StructureToolProvider>
      </RouterProvider>
    </TestProvider>
  )

  const {rerender} = render(ui(panes))
  return {
    navigate: (nextPanes: RouterPanes) => rerender(ui(nextPanes)),
  }
}

describe('StructureTool with a resolving pane', () => {
  it('keeps the open document mounted while it moves to its place in the structure', async () => {
    const {structure, releaseRoot, releasePages} = createSlowStructure()
    const {navigate} = await renderStructureTool(structure, [
      [{id: '__resolve__page123', params: {type: 'page'}}],
    ])

    const input = await screen.findByRole('textbox', {name: 'Title'})
    expect(screen.queryByTestId('pane-list')).toBeNull()

    await userEvent.type(input, 'Hello')

    act(() => releaseRoot())
    expect(await screen.findByTestId('pane-list')).toBeInTheDocument()
    expect(screen.getByText('Finding the document in the structure…')).toBeInTheDocument()

    act(() => navigate([[{id: 'pages'}], [{id: 'page123'}]]))
    expect(screen.queryByText('Finding the document in the structure…')).toBeNull()
    expect(screen.getByRole('textbox', {name: 'Title'})).toBe(input)

    act(() => releasePages())
    expect(await screen.findByTestId('pane-documentList')).toBeInTheDocument()

    expect(screen.getByRole('textbox', {name: 'Title'})).toBe(input)
    expect(input).toHaveValue('Hello')
    expect(input).toHaveFocus()
  })
})
