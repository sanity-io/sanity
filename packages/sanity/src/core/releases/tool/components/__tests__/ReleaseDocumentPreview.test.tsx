import {render, screen} from '@testing-library/react'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleaseDocumentPreview} from '../ReleaseDocumentPreview'

vi.mock('../../../index', () => ({
  useDocumentPresence: vi.fn().mockReturnValue([]),
}))

describe('ReleaseDocumentPreview', () => {
  beforeEach(async () => {
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    render(
      <RouterProvider
        router={route.create('/', [route.create('/:releaseId'), route.intents('/intents')])}
        state={{releaseId: 'releaseId'}}
        onNavigate={vi.fn()}
      >
        <ReleaseDocumentPreview
          documentId="documentId"
          documentTypeName="documentTypeName"
          releaseId="_.releases.releaseId"
          previewValues={{
            title: 'title',
            description: 'description',
          }}
          isLoading={false}
          hasValidationError={false}
        />
      </RouterProvider>,
      {wrapper},
    )
  })

  test('shows the preview', () => {
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('description')).toBeInTheDocument()
  })
})
