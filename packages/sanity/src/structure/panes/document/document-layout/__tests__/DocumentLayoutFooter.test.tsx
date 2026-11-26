import {queryHelpers, render, screen} from '@testing-library/react'
import {afterEach, beforeAll, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {usePane} from '../../../../components/pane/usePane'
import {DocumentLayoutFooter} from '../DocumentLayoutFooter'

vi.mock('../../../../components/pane/usePane')

vi.mock('../../statusBar/DocumentStatusBar', () => ({
  DocumentStatusBar: () => <span data-testid="document-status-bar" />,
}))

const mockUsePane = usePane as Mock<typeof usePane>

let wrapper: React.ComponentType<{children: React.ReactNode}>

function queryFooters() {
  return queryHelpers.queryAllByAttribute('data-sanity-document-footer', document.body, '')
}

function renderFooter() {
  render(
    <DocumentLayoutFooter
      documentPanelPortalElement={null}
      setFooterElement={vi.fn()}
      setActionsBoxElement={vi.fn()}
    />,
    {wrapper},
  )
}

beforeAll(async () => {
  wrapper = await createTestProvider()
})

describe('DocumentLayoutFooter', () => {
  beforeEach(() => {
    mockUsePane.mockReturnValue({collapsed: false, isLast: true} as ReturnType<typeof usePane>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('marks the footer with the attribute a host selects on to hide it', async () => {
    renderFooter()
    await screen.findByTestId('document-status-bar')

    expect(queryFooters()).toHaveLength(1)
  })

  it('puts the attribute on the pane footer that holds the status bar and document actions', async () => {
    renderFooter()

    const statusBar = await screen.findByTestId('document-status-bar')
    const [footer] = queryFooters()

    expect(footer).toBe(screen.getByTestId('pane-footer'))
    expect(footer).toContainElement(statusBar)
  })
})
