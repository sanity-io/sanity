import {takeSnapshot} from '@chromatic-com/vitest'
import {type FileAsset} from '@sanity/types'
import {useMemo} from 'react'
import {of} from 'rxjs'
import {defineField, defineType} from 'sanity'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {expectStable, testHelpers} from '../../../../../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../../../../../test/browser/TestWrapper'
import type * as AssetsModule from '../../../../../../../../../form/studio/inputs/client-adapters/assets'
import {useSchema} from '../../../../../../../../../hooks/useSchema'
import {SearchProvider} from '../../../../../contexts/search/SearchProvider'
import {FileReferencePreview} from '../asset/preview/FileReferencePreview'
import {ReferenceAutocomplete} from '../reference/ReferenceAutocomplete'

// The preview store listens on the mock client and never emits a file document.
// Return a fixture so the filename and size render instead of the loading skeleton.
const {FILE_ASSET} = vi.hoisted(() => ({
  FILE_ASSET: {
    _createdAt: '2026-03-15T12:00:00.000Z',
    _id: 'file-preview-fixture',
    _rev: 'rev',
    _type: 'sanity.fileAsset',
    _updatedAt: '2026-03-15T12:00:00.000Z',
    assetId: 'preview',
    extension: 'pdf',
    metadata: {},
    mimeType: 'application/pdf',
    originalFilename: 'archive-field-notes-march-2026.pdf',
    path: 'files/mock/mock/preview.pdf',
    sha1hash: 'abc123',
    size: 1_572_864,
    url: 'https://cdn.sanity.io/files/mock/mock/preview.pdf',
  } satisfies FileAsset,
}))

vi.mock(
  '../../../../../../../../../form/studio/inputs/client-adapters/assets',
  async (importOriginal) => {
    const actual = await importOriginal<typeof AssetsModule>()
    return {
      ...actual,
      observeFileAsset: () => of(FILE_ASSET),
    }
  },
)

const schemaTypes = [
  defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [defineField({name: 'name', title: 'Name', type: 'string'})],
  }),
]

const FILE_REFERENCE = {_ref: 'file-preview-fixture', _type: 'reference' as const}

/**
 * Chromatic sentinel for a resolved file reference (filename, size, icon) and
 * the reference autocomplete empty result. The file asset and the query are
 * fixtures; the mock client never leaves the process.
 */
function SearchReferencePreviewsHarness() {
  const schema = useSchema()
  const author = schema.get('author')
  const types = useMemo(() => (author ? [author] : []), [author])

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 24, width: 320}}>
      <FileReferencePreview reference={FILE_REFERENCE} />
      <ReferenceAutocomplete types={types} />
    </div>
  )
}

function Harness() {
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <SearchProvider>
        <SearchReferencePreviewsHarness />
      </SearchProvider>
    </TestWrapper>
  )
}

describe('search reference previews', () => {
  it('shows a file reference and the autocomplete empty state', async () => {
    const {settleChromaticEndState} = testHelpers()
    await render(<Harness />)

    await expect
      .element(page.getByText('archive-field-notes-march-2026.pdf', {exact: true}))
      .toBeVisible()
    await expect.element(page.getByText('1.5 MB', {exact: true})).toBeVisible()

    const input = page.getByRole('combobox', {name: 'Search for Author'})
    await expect.element(input).toBeVisible()
    await userEvent.fill(input, 'missing-document')

    await expect.element(page.getByText('No results for', {exact: false})).toBeVisible()
    await expect.element(page.getByText('missing-document', {exact: true})).toBeVisible()
    const filename = page.getByText('archive-field-notes-march-2026.pdf', {exact: true})
    await expectStable(() => filename.element().getBoundingClientRect().width)
    await takeSnapshot('file reference and empty results')

    const inputElement = input.element()
    if (inputElement instanceof HTMLElement) inputElement.blur()
    await settleChromaticEndState()
  })
})
