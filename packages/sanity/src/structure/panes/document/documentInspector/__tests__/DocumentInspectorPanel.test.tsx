import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type DocumentInspector} from 'sanity'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../i18n'
import {DocumentInspectorPanel} from '../DocumentInspectorPanel'

vi.mock('../../../../components/pane/usePane', () => ({
  usePane: vi.fn(() => ({collapsed: false})),
}))

vi.mock('../../../../useStructureTool', () => ({
  useStructureTool: vi.fn(() => ({features: {resizablePanes: false}})),
}))

vi.mock('../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

const {useDocumentPane} = vi.mocked(await import('../../useDocumentPane'))

const closeInspector = vi.fn()

async function renderInspectorPanel(component: DocumentInspector['component']) {
  useDocumentPane.mockReturnValue({
    closeInspector,
    inspector: {name: 'test/inspector', component},
  } as unknown as ReturnType<typeof useDocumentPane>)

  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

  render(<DocumentInspectorPanel documentId="doc-id" documentType="book" />, {
    wrapper,
    // React logs caught errors to the console by default, which only adds noise here
    onCaughtError: () => {},
  })
}

describe('DocumentInspectorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the inspector', async () => {
    await renderInspectorPanel(() => <div>Inspector contents</div>)

    expect(await screen.findByText('Inspector contents')).toBeInTheDocument()
  })

  it('renders a recoverable error instead of letting an inspector crash escape the panel', async () => {
    await renderInspectorPanel(() => {
      throw new Error('Path is not an array')
    })

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('An error occurred while rendering this panel.')).toBeInTheDocument()
    expect(screen.getByText('Path is not an array')).toBeInTheDocument()
  })

  it('closes the inspector from the error state', async () => {
    await renderInspectorPanel(() => {
      throw new Error('Path is not an array')
    })

    await userEvent.click(await screen.findByRole('button', {name: 'Close panel'}))

    expect(closeInspector).toHaveBeenCalledWith('test/inspector')
  })

  it('renders the inspector again when retrying', async () => {
    let shouldThrow = true

    await renderInspectorPanel(() => {
      if (shouldThrow) throw new Error('Path is not an array')
      return <div>Inspector contents</div>
    })

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()

    shouldThrow = false
    await userEvent.click(screen.getByRole('button', {name: 'Retry'}))

    expect(await screen.findByText('Inspector contents')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })
})
