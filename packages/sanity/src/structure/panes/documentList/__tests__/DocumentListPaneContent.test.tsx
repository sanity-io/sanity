import {render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {defineConfig} from 'sanity'
import {PaneContext, PaneLayoutContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {DocumentListPaneContent} from '../DocumentListPaneContent'
import {type DocumentListPaneItem} from '../types'

vi.mock('../../../components/paneItem/PaneItem', () => ({
  PaneItem: () => <div data-testid="pane-item" />,
}))

const items: DocumentListPaneItem[] = [
  {_id: 'a', _type: 'author', hasPublished: true, hasDraft: false},
  {_id: 'b', _type: 'author', hasPublished: true, hasDraft: false},
]

/** The pane and its layout come from context; `index` is what the layout controller assigns. */
function Panes(props: {children: ReactNode; index: number | undefined; collapsed: boolean}) {
  return (
    <PaneLayoutContext.Provider
      value={{
        collapse: vi.fn(),
        collapsed: false,
        expand: vi.fn(),
        expandedElement: null,
        mount: vi.fn(() => () => undefined),
        panes: [],
        resize: vi.fn(),
        resizing: false,
      }}
    >
      <PaneContext.Provider
        value={{
          collapse: vi.fn(),
          collapsed: props.collapsed,
          expand: vi.fn(),
          index: props.index,
          isLast: true,
          rootElement: null,
        }}
      >
        {props.children}
      </PaneContext.Provider>
    </PaneLayoutContext.Provider>
  )
}

function content(pane: {index: number | undefined; collapsed: boolean}) {
  return (
    <Panes {...pane}>
      <DocumentListPaneContent
        error={null}
        filterIsSimpleTypeConstraint
        hasSearchQuery={false}
        isConnected
        isLazyLoading={false}
        isLoading={false}
        canRetry={false}
        items={items}
        onEndReached={vi.fn()}
        paneTitle="Authors"
        searchInputElement={null}
        showIcons
      />
    </Panes>
  )
}

describe('DocumentListPaneContent', () => {
  it('keeps the same list when the pane loses its layout index or collapses', async () => {
    const wrapper = await createTestProvider({
      config: defineConfig({projectId: 'test', dataset: 'test'}),
      resources: [structureUsEnglishLocaleBundle],
    })
    const {rerender} = render(content({index: 1, collapsed: false}), {wrapper})
    const list = await screen.findByRole('listbox', {name: 'Authors'})

    // A pane hidden by an `<Activity>` boundary is unmounted from the pane layout controller,
    // so its index is unknown until it is shown again; a collapsed pane hides the same list.
    // Neither is a reason to start the list over: a remount drops its scroll position and shows
    // every row as a skeleton until the previews load again.
    rerender(content({index: undefined, collapsed: false}))
    expect(screen.getByRole('listbox', {name: 'Authors'})).toBe(list)

    rerender(content({index: 1, collapsed: true}))
    expect(screen.getByRole('listbox', {name: 'Authors', hidden: true})).toBe(list)

    rerender(content({index: 1, collapsed: false}))
    expect(screen.getByRole('listbox', {name: 'Authors'})).toBe(list)
  })
})
