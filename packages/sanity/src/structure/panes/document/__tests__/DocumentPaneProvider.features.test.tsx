import {type SanityClient} from '@sanity/client'
import {render, screen} from '@testing-library/react'
import {type DocumentFeature, type DocumentFeaturesResolver, type SingleWorkspace} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {usePaneRouter} from '../../../components/paneRouter/usePaneRouter'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {structureTool} from '../../../structureTool'
import {type DocumentPaneNode} from '../../../types'
import {HISTORY_INSPECTOR_NAME} from '../constants'
import {DocumentPaneProvider} from '../DocumentPaneProvider'
import {type HistoryStoreProps} from '../types'
import {useDocumentFeatures} from '../useDocumentFeatures'
import {useDocumentPane} from '../useDocumentPane'

vi.mock('../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(),
}))

vi.mock('../../../useStructureTool', () => ({
  useStructureTool: vi.fn(() => ({features: {reviewChanges: true, splitViews: true}})),
}))

vi.mock('../../../components/structureTool/StructureTitle', () => ({
  DocumentTitle: () => null,
}))

const mockUsePaneRouter = vi.mocked(usePaneRouter)

const historyStore = {
  error: null,
  onOlderRevision: false,
  revisionId: null,
  revisionDocument: null,
  sinceDocument: null,
  ready: true,
  isPristine: true,
  lastNonDeletedRevId: null,
} satisfies HistoryStoreProps

const pane = {
  id: 'doc-1',
  type: 'document',
  options: {id: 'doc-1', type: 'author'},
  views: [{id: 'form', type: 'form'}],
} as unknown as DocumentPaneNode

const bookmark = vi.fn()

function FeaturesProbe() {
  const {inspectors, fieldActions, inspector} = useDocumentPane()
  const {byName, header, menu} = useDocumentFeatures()

  return (
    <div
      data-testid="features-probe"
      data-inspectors={inspectors.map((entry) => entry.name).join(',')}
      data-field-actions={fieldActions.map((entry) => entry.name).join(',')}
      data-by-name={[...byName.keys()].join(',')}
      data-by-name-size={byName.size}
      data-header={header.map((entry) => entry.name).join(',')}
      data-menu={menu.map((entry) => entry.name).join(',')}
      data-menu-shortcuts={menu.map((entry) => entry.toolbar.shortcut ?? '').join(',')}
      data-current-inspector={inspector?.name ?? 'none'}
    />
  )
}

async function renderProvider(
  options: {
    config?: Partial<SingleWorkspace>
    params?: Record<string, string>
  } = {},
) {
  mockUsePaneRouter.mockReturnValue({
    index: 0,
    hasGroupSiblings: false,
    params: options.params ?? {},
    setParams: vi.fn(),
    duplicateCurrent: vi.fn(),
    closeCurrent: vi.fn(),
  } as unknown as ReturnType<typeof usePaneRouter>)

  const TestProvider = await createTestProvider({
    // The default mock client answers the dataset ACL request with null, which the grants store
    // dereferences while the form resolves its permissions.
    client: createMockSanityClient({requests: {'/acl': []}}) as unknown as SanityClient,
    config: options.config,
    resources: [structureUsEnglishLocaleBundle],
  })

  render(
    <TestProvider>
      <DocumentPaneProvider
        historyStore={historyStore}
        index={0}
        itemId="item-1"
        pane={pane}
        paneKey="pane-1"
      >
        <FeaturesProbe />
      </DocumentPaneProvider>
    </TestProvider>,
  )

  return screen.findByTestId('features-probe')
}

const withStructure: Partial<SingleWorkspace> = {plugins: [structureTool()]}

function withFeatures(features: DocumentFeaturesResolver): Partial<SingleWorkspace> {
  return {...withStructure, document: {features}}
}

function bookmarkFeature(shortcut?: string): DocumentFeature {
  return {
    name: 'bookmark',
    toolbar: {placement: 'menu', title: 'Bookmark', shortcut, onAction: bookmark},
  }
}

describe('DocumentPaneProvider document features', () => {
  it('publishes the structure inspectors in registration order under the default config', async () => {
    const probe = await renderProvider({config: withStructure})

    expect(probe.getAttribute('data-inspectors')?.split(',').slice(0, 3)).toEqual([
      'sanity/structure/validation',
      HISTORY_INSPECTOR_NAME,
      'sanity/structure/incoming-references',
    ])
    expect(probe.getAttribute('data-by-name')?.split(',')).toEqual(
      expect.arrayContaining(['validation', 'history', 'incomingReferences']),
    )
  })

  it('leaves every list empty when the config removes every feature', async () => {
    const probe = await renderProvider({config: withFeatures(() => [])})

    expect(probe).toHaveAttribute('data-inspectors', '')
    expect(probe).toHaveAttribute('data-field-actions', '')
    expect(probe).toHaveAttribute('data-header', '')
    expect(probe).toHaveAttribute('data-menu', '')
    expect(probe).toHaveAttribute('data-by-name-size', '0')
  })

  it('resolves no current inspector when the url names one the config filtered out', async () => {
    const probe = await renderProvider({
      config: withFeatures((prev) => prev.filter((feature) => feature.name !== 'history')),
      params: {inspect: HISTORY_INSPECTOR_NAME},
    })

    expect(probe).toHaveAttribute('data-current-inspector', 'none')
    expect(probe.getAttribute('data-inspectors')).not.toContain(HISTORY_INSPECTOR_NAME)
  })

  it('withdraws the built-in inspect feature when the config filters it out', async () => {
    const probe = await renderProvider({
      config: withFeatures((prev) => prev.filter((feature) => feature.name !== 'inspect')),
    })

    const names = probe.getAttribute('data-by-name')?.split(',')

    expect(names).not.toContain('inspect')
    expect(names).toContain('compareVersions')
  })

  it('hands a menu feature contributed by the config to the overflow menu', async () => {
    const probe = await renderProvider({
      config: withFeatures((prev) => [...prev, bookmarkFeature()]),
    })

    expect(probe).toHaveAttribute('data-menu', 'bookmark')
  })

  it('carries a menu feature shortcut and its onAction through to the resolution', async () => {
    const probe = await renderProvider({
      config: withFeatures((prev) => [...prev, bookmarkFeature('Ctrl+Alt+L')]),
    })

    expect(probe).toHaveAttribute('data-menu-shortcuts', 'Ctrl+Alt+L')
  })

  it('keeps the built-in inspect feature alongside a menu feature claiming its shortcut', async () => {
    const probe = await renderProvider({
      config: withFeatures((prev) => [...prev, bookmarkFeature('Ctrl+Alt+I')]),
    })

    expect(probe.getAttribute('data-by-name')?.split(',')).toContain('inspect')
    expect(probe).toHaveAttribute('data-menu', 'bookmark')
  })
})
