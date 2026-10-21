import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {Text} from '@sanity/ui'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type ArrayOfPrimitivesInputProps} from '../../../../types/inputProps'
import {UploadTargetCard} from '../arrayOfPrimitiveUploadTarget'

function PrimitiveUploadTargetInput(props: ArrayOfPrimitivesInputProps) {
  return (
    <UploadTargetCard
      types={props.schemaType.of}
      resolveUploader={props.resolveUploader}
      onUpload={props.onUpload}
      data-testid="primitive-upload-target"
      border
      radius={2}
      padding={5}
    >
      <Text muted size={1}>
        Drop text files to add them as items
      </Text>
    </UploadTargetCard>
  )
}

const SCHEMA = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'tags',
        title: 'Tags',
        of: [defineArrayMember({type: 'string'})],
        components: {input: PrimitiveUploadTargetInput},
      }),
    ],
  }),
]

function PrimitiveUploadTargetHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <TestForm />
    </TestWrapper>
  )
}

function dragFilesOver(element: Element, files: File[]) {
  const dataTransfer = new DataTransfer()
  files.forEach((file) => dataTransfer.items.add(file))
  element.dispatchEvent(new DragEvent('dragenter', {bubbles: true, cancelable: true, dataTransfer}))
}

describe('array of primitives upload target', () => {
  test('shows the drop message while accepted and rejected files are dragged over', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<PrimitiveUploadTargetHarness />)

    const target = page.getByTestId('primitive-upload-target')
    await expect.element(target).toBeVisible()

    dragFilesOver(target.element(), [
      new File(['alpha'], 'tags.txt', {type: 'text/plain'}),
      new File([''], 'photo.png', {type: 'image/png'}),
    ])

    await expect.element(target.getByText('Drop to upload')).toBeVisible()
    await expect.element(target.getByText("1 file can't be uploaded here")).toBeVisible()
    await settleChromaticEndState()
  })
})
