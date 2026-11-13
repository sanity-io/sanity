import {defineField, defineType} from '@sanity/types'
import type * as SanityExports from 'sanity'
import {useDocumentPreviewValues} from 'sanity'
import {describe, expect, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {RouterProvider} from '../../../router/RouterProvider'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {router} from '../../router'
import {type MainDocumentState} from '../../types'
import {ContentEditor} from '../ContentEditor'

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof SanityExports>()
  return {
    ...actual,
    useDocumentPreviewValues: vi.fn(actual.useDocumentPreviewValues),
  }
})

vi.mock('../DocumentPanel', () => ({
  DocumentPanel: (props: {documentId: string}) => (
    <div data-testid="document-panel">{props.documentId}</div>
  ),
}))

const pageType = defineType({
  name: 'page',
  type: 'document',
  title: 'Page',
  fields: [defineField({name: 'title', type: 'string'})],
})

const TITLES: Record<string, string> = {
  'main-page': 'Home',
  'referenced-page': 'Hero teaser',
}

const MAIN_DOCUMENT_STATE: MainDocumentState = {
  path: '/',
  document: {_id: 'main-page', _type: 'page'},
}

function ContentEditorHarness(props: {documentId: string}) {
  return (
    <TestWrapper schemaTypes={[pageType]} i18nBundles={[presentationUsEnglishLocaleBundle]}>
      <RouterProvider router={router} state={{}} onNavigate={() => {}}>
        <ContentEditor
          documentId={props.documentId}
          documentType="page"
          mainDocumentState={MAIN_DOCUMENT_STATE}
          onEditReference={() => {}}
          onFocusPath={() => {}}
          onStructureParams={() => {}}
          refs={[]}
          visualOrderPublishedIds={[]}
          searchParams={{}}
          structureParams={{}}
        />
      </RouterProvider>
    </TestWrapper>
  )
}

describe('content editor', () => {
  test('shows the way back to the main document above a referenced document', async () => {
    vi.mocked(useDocumentPreviewValues).mockImplementation(({documentId}) => ({
      value: {title: TITLES[documentId]},
      isLoading: false,
    }))

    void render(<ContentEditorHarness documentId="referenced-page" />)

    await expect.element(page.getByTestId('document-panel')).toBeInTheDocument()
    await expect
      .element(page.getByTestId('presentation-main-document-link'))
      .toHaveTextContent('Home')
    await expect
      .element(page.getByTestId('presentation-document-breadcrumb-current'))
      .toHaveTextContent('Hero teaser')
  })

  test('shows the main document as the current crumb while it is open', async () => {
    vi.mocked(useDocumentPreviewValues).mockImplementation(({documentId}) => ({
      value: {title: TITLES[documentId]},
      isLoading: false,
    }))

    void render(<ContentEditorHarness documentId="main-page" />)

    await expect.element(page.getByTestId('document-panel')).toBeInTheDocument()
    await expect
      .element(page.getByTestId('presentation-document-breadcrumb-current'))
      .toHaveTextContent('Home')
    await expect
      .element(page.getByTestId('presentation-main-document-link'))
      .not.toBeInTheDocument()
  })
})
