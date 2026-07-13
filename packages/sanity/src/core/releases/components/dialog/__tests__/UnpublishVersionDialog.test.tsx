import {defineType} from '@sanity/types'
import {render, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../../config'
import {useDocumentOperation} from '../../../../hooks/useDocumentOperation'
import {UnpublishVersionDialog} from '../UnpublishVersionDialog'

vi.mock('../../../../hooks/useDocumentOperation', () => ({
  useDocumentOperation: vi.fn(() => ({unpublish: {execute: vi.fn()}})),
}))

vi.mock('../../../../hooks/useDocumentOperationEvent', () => ({
  useDocumentOperationEvent: vi.fn(() => undefined),
}))

vi.mock('../../../store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => ({data: []})),
}))

vi.mock('../../../store/useArchivedReleases', () => ({
  useArchivedReleases: vi.fn(() => ({data: []})),
}))

vi.mock('../../../../preview/components/Preview', () => ({
  Preview: () => null,
}))

vi.mock('../../../../preview', () => ({
  useValuePreview: vi.fn(() => ({value: {title: 'Test document'}})),
}))

const config = defineConfig({
  projectId: 'test',
  dataset: 'test',
  schema: {
    types: [
      defineType({
        name: 'testDoc',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      }),
    ],
  },
})

describe('UnpublishVersionDialog', () => {
  beforeEach(() => {
    vi.mocked(useDocumentOperation).mockClear()
  })

  it('uses useDocumentOperation with the release id for version unpublish', async () => {
    const wrapper = await createTestProvider({config})
    render(
      <UnpublishVersionDialog
        onClose={vi.fn()}
        documentVersionId="versions.rSummer.my-doc"
        documentType="testDoc"
      />,
      {wrapper},
    )

    await waitFor(() =>
      expect(useDocumentOperation).toHaveBeenCalledWith('my-doc', 'testDoc', 'rSummer'),
    )
  })
})
