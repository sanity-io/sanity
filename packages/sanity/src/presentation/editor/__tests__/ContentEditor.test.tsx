import {render, screen} from '@testing-library/react'
import {defineType} from 'sanity'
import {RouterProvider} from 'sanity/router'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {router} from '../../router'
import {type MainDocumentState} from '../../types'
import {ContentEditor} from '../ContentEditor'

vi.mock('../DocumentPanel', () => ({
  DocumentPanel: (props: {documentId: string}) => (
    <div data-testid="document-panel">{props.documentId}</div>
  ),
}))

const mainDocumentState: MainDocumentState = {
  path: '/',
  document: {_id: 'main-page', _type: 'page'},
}

async function renderContentEditor(props: {
  documentId?: string
  mainDocumentState?: MainDocumentState
}) {
  const wrapper = await createTestProvider({
    config: {
      schema: {
        types: [
          defineType({
            name: 'page',
            type: 'document',
            fields: [{name: 'title', type: 'string'}],
          }),
        ],
      },
    },
    resources: [presentationUsEnglishLocaleBundle],
  })

  return render(
    <RouterProvider router={router} state={{}} onNavigate={vi.fn()}>
      <ContentEditor
        documentId={props.documentId}
        documentType={props.documentId ? 'page' : undefined}
        mainDocumentState={props.mainDocumentState}
        onEditReference={vi.fn()}
        onFocusPath={vi.fn()}
        onStructureParams={vi.fn()}
        refs={[]}
        visualOrderPublishedIds={[]}
        searchParams={{}}
        structureParams={{}}
      />
    </RouterProvider>,
    {wrapper},
  )
}

describe('ContentEditor', () => {
  it('links back to the main document when another document is open', async () => {
    await renderContentEditor({documentId: 'referenced-page', mainDocumentState})

    expect(await screen.findByTestId('document-panel')).toHaveTextContent('referenced-page')
    const link = screen.getByTestId('presentation-main-document-link')
    expect(link).toHaveAttribute('href', '/page/main-page')
  })

  it('shows the open document as the current crumb after the main document', async () => {
    await renderContentEditor({documentId: 'referenced-page', mainDocumentState})

    await screen.findByTestId('document-panel')
    const current = screen.getByTestId('presentation-document-breadcrumb-current')
    expect(current).toHaveAttribute('aria-current', 'location')
    expect(screen.getByTestId('presentation-main-document-link')).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('shows the main document as the only, current crumb while it is the open document', async () => {
    await renderContentEditor({documentId: 'drafts.main-page', mainDocumentState})

    expect(await screen.findByTestId('document-panel')).toBeInTheDocument()
    expect(screen.getByTestId('presentation-document-breadcrumb')).toBeInTheDocument()
    expect(screen.getByTestId('presentation-document-breadcrumb-current')).toHaveAttribute(
      'aria-current',
      'location',
    )
    expect(screen.queryByTestId('presentation-main-document-link')).not.toBeInTheDocument()
  })

  it('shows the open document as the only, current crumb when the route has no main document', async () => {
    await renderContentEditor({
      documentId: 'referenced-page',
      mainDocumentState: {path: '/', document: undefined},
    })

    expect(await screen.findByTestId('document-panel')).toBeInTheDocument()
    expect(screen.getByTestId('presentation-document-breadcrumb-current')).toHaveAttribute(
      'aria-current',
      'location',
    )
    expect(screen.queryByTestId('presentation-main-document-link')).not.toBeInTheDocument()
  })

  it('has no close button in the breadcrumb row', async () => {
    await renderContentEditor({documentId: 'referenced-page', mainDocumentState})

    await screen.findByTestId('document-panel')
    expect(screen.queryByRole('button', {name: 'Close'})).not.toBeInTheDocument()
  })
})
