import {render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {type DocumentPaneNode} from '../../../types'
import {type DocumentToolbarSlots} from '../document-layout/documentToolbarSlots'
import {DocumentPane} from '../DocumentPane'

vi.mock('../DocumentPaneProviderWrapper', () => ({
  DocumentPaneProviderWrapper: ({children}: {children: ReactNode}) => children,
}))

vi.mock('../comments/CommentsWrapper', () => ({
  CommentsWrapper: ({children}: {children: ReactNode}) => children,
}))

vi.mock('../../../diffView/plugin/DiffViewDocumentLayout', () => ({
  DiffViewDocumentLayout: ({children}: {children: ReactNode}) => children,
}))

vi.mock('../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(() => ({
    params: {},
    groupIndex: 0,
    routerPanesState: [[{id: 'doc-1'}]],
    ReferenceChildLink: () => null,
    handleEditReference: vi.fn(),
  })),
}))

vi.mock('../useResetHistoryParams', () => ({
  useResetHistoryParams: vi.fn(),
}))

vi.mock('../document-layout/DocumentLayout', () => ({
  DocumentLayout: (layoutProps: {
    actionsPlacement?: string
    actionsSlots?: DocumentToolbarSlots
  }) => (
    <div
      data-testid="document-layout"
      data-actions-placement={layoutProps.actionsPlacement ?? 'unset'}
      data-actions-slots={Object.keys(layoutProps.actionsSlots ?? {}).join(',')}
    />
  ),
}))

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentType: vi.fn(() => ({documentType: 'author', isLoaded: true})),
  useTargetDocumentState: vi.fn(() => ({status: 'ready', targetDocument: {_id: 'doc-1'}})),
  useTemplatePermissions: vi.fn(() => [[], false]),
}))

const pane = {
  id: 'doc-1',
  type: 'document',
  options: {id: 'doc-1', type: 'author'},
} as unknown as DocumentPaneNode

function DocumentStatusSlot() {
  return null
}

async function renderDocumentPane(paneProps: {
  actionsPlacement?: 'top' | 'bottom'
  actionsSlots?: DocumentToolbarSlots
}) {
  const TestProvider = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

  return render(
    <TestProvider>
      <DocumentPane index={0} itemId="item-1" pane={pane} paneKey="pane-1" {...paneProps} />
    </TestProvider>,
  )
}

describe('DocumentPane', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('forwards actionsPlacement to the document layout', async () => {
    await renderDocumentPane({actionsPlacement: 'top'})

    expect(await screen.findByTestId('document-layout')).toHaveAttribute(
      'data-actions-placement',
      'top',
    )
  })

  it('forwards actionsSlots to the document layout', async () => {
    await renderDocumentPane({actionsSlots: {documentStatus: DocumentStatusSlot}})

    expect(await screen.findByTestId('document-layout')).toHaveAttribute(
      'data-actions-slots',
      'documentStatus',
    )
  })

  it('leaves the placement unset when a host does not ask for one', async () => {
    await renderDocumentPane({})

    expect(await screen.findByTestId('document-layout')).toHaveAttribute(
      'data-actions-placement',
      'unset',
    )
  })
})
