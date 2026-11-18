import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {createSchema} from 'sanity'
import {type ChildLinkProps, PaneRouterContext, type PaneRouterContextValue} from 'sanity/structure'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {PaneItem} from '../PaneItem'

vi.mock('../../../../core/releases/hooks/useDocumentVersions', () => ({
  useDocumentVersions: () => ({
    versions: [
      {
        _id: 'siteSettings',
        _rev: 'rev',
        _createdAt: '2026-01-01T00:00:00Z',
        _updatedAt: '2026-01-01T00:00:00Z',
        _type: 'siteSettings',
        _system: {},
      },
    ],
    loading: false,
  }),
}))

const mockUseDocumentPresence = vi.hoisted(() => vi.fn((_documentId: string) => []))
const mockUseEditState = vi.hoisted(() => vi.fn())

vi.mock('../../../../core/store/presence/useDocumentPresence', () => ({
  useDocumentPresence: mockUseDocumentPresence,
}))

vi.mock('../../../../core/hooks/useEditState', () => ({
  useEditState: mockUseEditState,
}))

const mockPaneRouterContextValue: PaneRouterContextValue = {
  index: 0,
  groupIndex: 0,
  siblingIndex: 0,
  payload: undefined,
  params: {},
  hasGroupSiblings: false,
  groupLength: 1,
  routerPanesState: [],
  ChildLink: ({children}) => <>{children}</>,
  ReferenceChildLink: ({children}) => <>{children}</>,
  handleEditReference: () => {},
  ParameterizedLink: () => null,
  replaceCurrent: () => {},
  closeCurrent: () => {},
  closeCurrentAndAfter: () => {},
  duplicateCurrent: () => {},
  setView: () => {},
  setParams: () => {},
  setPayload: () => {},
  createPathWithParams: () => '',
  navigateIntent: () => {},
}

interface HoverableChildLinkProps extends ChildLinkProps {
  'data-testid'?: string
  'onMouseEnter'?: () => void
  'onMouseLeave'?: () => void
}

function HoverableChildLink(props: HoverableChildLinkProps) {
  return (
    <div
      data-testid={props['data-testid']}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      {props.children}
    </div>
  )
}

async function renderPaneItem(props: Parameters<typeof PaneItem>[0]) {
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

  return render(
    <PaneRouterContext.Provider
      value={{...mockPaneRouterContextValue, ChildLink: HoverableChildLink}}
    >
      <PaneItem {...props} />
    </PaneRouterContext.Provider>,
    {wrapper},
  )
}

describe('PaneItem count badge', () => {
  it('renders the locale-formatted count when count is a number', async () => {
    await renderPaneItem({id: 'species', title: 'Species', count: 32145})

    const badge = await screen.findByTestId('pane-item-count')
    expect(badge).toHaveTextContent('32,145')
  })

  it('renders a resolved count of 0 as 0', async () => {
    await renderPaneItem({id: 'species', title: 'Species', count: 0})

    const badge = await screen.findByTestId('pane-item-count')
    expect(badge).toHaveTextContent('0')
  })

  it('does not render a count badge when count is undefined', async () => {
    await renderPaneItem({id: 'species', title: 'Species'})

    expect(screen.queryByTestId('pane-item-count')).not.toBeInTheDocument()
  })
})

describe('PaneItem singleton', () => {
  const settingsType = createSchema({
    name: 'default',
    types: [{name: 'siteSettings', type: 'document', fields: [{name: 'logo', type: 'string'}]}],
  }).get('siteSettings')

  it('keeps the configured title and chevron and shows the document status', async () => {
    const {container} = await renderPaneItem({
      id: 'settings',
      title: 'Site settings',
      schemaType: settingsType,
      singletonDocumentId: 'siteSettings',
    })

    expect(await screen.findByText('Site settings')).toBeInTheDocument()
    expect(screen.queryByText('Untitled')).not.toBeInTheDocument()
    expect(container.querySelector('[data-sanity-icon="chevron-right"]')).toBeInTheDocument()
    expect(container.querySelector('[data-status="published"]')).toBeInTheDocument()
  })

  it('shows no status when there is no singleton document id', async () => {
    const {container} = await renderPaneItem({
      id: 'settings',
      title: 'Site settings',
      schemaType: settingsType,
    })

    expect(await screen.findByText('Site settings')).toBeInTheDocument()
    expect(container.querySelector('[data-status]')).not.toBeInTheDocument()
  })

  describe('document id for presence and preload', () => {
    async function hoverUntilPreload(props: Parameters<typeof PaneItem>[0]) {
      await renderPaneItem(props)
      await userEvent.hover(screen.getByTestId(`pane-item-${props.title}`))
      await waitFor(() => expect(mockUseEditState).toHaveBeenCalled())
    }

    it('uses the singleton document id when set', async () => {
      await hoverUntilPreload({
        id: 'settings',
        title: 'Site settings',
        schemaType: settingsType,
        singletonDocumentId: 'siteSettings',
      })

      const presenceIds = mockUseDocumentPresence.mock.calls.map(([documentId]) => documentId)
      expect(new Set(presenceIds)).toEqual(new Set(['siteSettings']))
      expect(mockUseEditState).toHaveBeenCalledWith('siteSettings', 'siteSettings')
    })

    it('uses the item id for a document value without a singleton document id', async () => {
      await hoverUntilPreload({
        id: 'doc-1',
        title: 'Doc one',
        schemaType: settingsType,
        value: {_id: 'doc-1', _type: 'siteSettings', _createdAt: '', _updatedAt: '', _rev: 'rev'},
      })

      expect(mockUseDocumentPresence).toHaveBeenCalledWith('doc-1')
      expect(mockUseEditState).toHaveBeenCalledWith('doc-1', 'siteSettings')
    })
  })
})
