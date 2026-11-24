import {defineField, defineType, type FileAsset, type SanityDocument} from '@sanity/types'
import {of} from 'rxjs'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {useClient} from '../../../../../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'
import {type ObjectInputProps} from '../../../../types/inputProps'
import {BaseFileInput, type BaseFileInputValue} from '../FileInput'

const LONG_FILENAME =
  'Screen Recording 2026-11-23 with a long name that should definitely overflow the content of the field.mov'
const FILE_REF = 'file-a75b03fdd5b5fa36947bf2b776a542e0c940f682-mov'
const DOCUMENT: SanityDocument = {
  _id: 'file-input-visual',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'file-input-visual-rev',
  file: {_type: 'file', asset: {_type: 'reference', _ref: FILE_REF}},
}
const FILE_ASSET = {
  _id: FILE_REF,
  _type: 'sanity.fileAsset',
  _rev: 'file-asset-rev',
  assetId: 'a75b03fdd5b5fa36947bf2b776a542e0c940f682',
  extension: 'mov',
  mimeType: 'video/quicktime',
  originalFilename: LONG_FILENAME,
  path: 'files/test/test/a75b03fdd5b5fa36947bf2b776a542e0c940f682.mov',
  size: 108_749,
  url: 'https://cdn.sanity.io/files/test/test/a75b03fdd5b5fa36947bf2b776a542e0c940f682.mov',
} as FileAsset

function observeAsset() {
  return of(FILE_ASSET)
}

function FileSchemaInput(props: ObjectInputProps<BaseFileInputValue>) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  return (
    <BaseFileInput
      {...(props as Parameters<typeof BaseFileInput>[0])}
      assetSources={[]}
      client={client}
      directUploads={false}
      observeAsset={observeAsset}
      resolveUploader={() => null}
    />
  )
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'file',
        name: 'file',
        title: 'A simple file',
        components: {input: FileSchemaInput},
      }),
    ],
  }),
]

function FileInputHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <div data-testid="container" style={{width: 500}}>
        <TestForm document={DOCUMENT} />
      </div>
    </TestWrapper>
  )
}

describe('file input', () => {
  test('truncates a long file name of an uploaded file instead of overflowing the field', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<FileInputHarness />)

    const filename = page.getByTestId('file-name')
    await expect.element(filename).toBeVisible()

    const nameRect = filename.element().getBoundingClientRect()
    const containerRect = page.getByTestId('container').element().getBoundingClientRect()
    const menuButtonRect = page.getByTestId('options-menu-button').element().getBoundingClientRect()

    expect(nameRect.right).toBeLessThanOrEqual(menuButtonRect.left)
    expect(menuButtonRect.right).toBeLessThanOrEqual(containerRect.right)
    await settleChromaticEndState()
  })
})
