import {defineField, defineType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type ComponentProps} from 'react'
import {type StateLink} from 'sanity/router'
import {describe, expect, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../test/browser/TestWrapper'
import type * as DocumentPreviewValuesExports from '../../../core/tasks/hooks/useDocumentPreviewValues'
import {useDocumentPreviewValues} from '../../../core/tasks/hooks/useDocumentPreviewValues'
import {RouterProvider} from '../../../router/RouterProvider'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {router} from '../../router'
import {DocumentBreadcrumb} from '../DocumentBreadcrumb'

vi.mock('../../../core/tasks/hooks/useDocumentPreviewValues', async (importOriginal) => {
  const actual = await importOriginal<typeof DocumentPreviewValuesExports>()
  return {
    ...actual,
    useDocumentPreviewValues: vi.fn(actual.useDocumentPreviewValues),
  }
})

const {settleChromaticEndState} = testHelpers()

const pageType = defineType({
  name: 'page',
  type: 'document',
  title: 'Page',
  fields: [defineField({name: 'title', type: 'string'})],
})

const TITLES: Record<string, string> = {
  'main-page': 'Home',
  'referenced-page': 'iPhone teaser',
}

const MAIN_DOCUMENT_LINK_STATE: ComponentProps<typeof StateLink>['state'] = {
  id: 'main-page',
  type: 'page',
  _searchParams: [],
}

const MAIN_DOCUMENT = {id: 'main-page', type: 'page', linkState: MAIN_DOCUMENT_LINK_STATE}

function DocumentBreadcrumbHarness(props: {
  documentId?: string
  mainDocument?: typeof MAIN_DOCUMENT
}) {
  return (
    <TestWrapper schemaTypes={[pageType]} i18nBundles={[presentationUsEnglishLocaleBundle]}>
      <RouterProvider router={router} state={{}} onNavigate={() => {}}>
        <Card padding={3} borderBottom>
          <DocumentBreadcrumb
            documentId={props.documentId ?? 'referenced-page'}
            documentType="page"
            mainDocument={props.mainDocument}
          />
        </Card>
      </RouterProvider>
    </TestWrapper>
  )
}

describe('document breadcrumb', () => {
  test('shows the main document as a link crumb and the open document in bold', async () => {
    vi.mocked(useDocumentPreviewValues).mockImplementation(({documentId}) => ({
      value: {title: TITLES[documentId]},
      isLoading: false,
    }))

    void render(<DocumentBreadcrumbHarness mainDocument={MAIN_DOCUMENT} />)

    await expect
      .element(page.getByTestId('presentation-main-document-link'))
      .toHaveTextContent('Home')
    await expect
      .element(page.getByTestId('presentation-document-breadcrumb-current'))
      .toHaveTextContent('iPhone teaser')
    // innerText reflects text-transform, so this fails if the title gets capitalized
    expect(page.getByTestId('presentation-document-breadcrumb-current').element()).toHaveProperty(
      'innerText',
      'iPhone teaser',
    )
    await expect
      .element(page.getByTestId('presentation-document-breadcrumb-current'))
      .toHaveAttribute('aria-current', 'location')
    await settleChromaticEndState()
  })

  test('shows the open document as the only, current crumb without a main document', async () => {
    vi.mocked(useDocumentPreviewValues).mockImplementation(({documentId}) => ({
      value: {title: TITLES[documentId]},
      isLoading: false,
    }))

    void render(<DocumentBreadcrumbHarness documentId="main-page" />)

    await expect
      .element(page.getByTestId('presentation-document-breadcrumb-current'))
      .toHaveTextContent('Home')
    await expect
      .element(page.getByTestId('presentation-document-breadcrumb-current'))
      .toHaveAttribute('aria-current', 'location')
    await expect
      .element(page.getByTestId('presentation-main-document-link'))
      .not.toBeInTheDocument()
    await settleChromaticEndState()
  })
})
