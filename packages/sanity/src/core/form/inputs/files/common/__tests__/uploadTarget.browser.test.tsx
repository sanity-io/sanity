import {defineField, defineType} from '@sanity/types'
import {Card, type CardProps, Stack, Text} from '@sanity/ui'
import {type ComponentType} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type FileLike} from '../../../../studio/uploads/types'
import {type ObjectInputProps} from '../../../../types/inputProps'
import {DropMessage} from '../DropMessage'
import {uploadTarget} from '../uploadTarget/uploadTarget'

const ImageUploadTarget = uploadTarget(Card as ComponentType<CardProps>)

const PNG: FileLike = {type: 'image/png', name: 'photo.png'}
const PDF: FileLike = {type: 'application/pdf', name: 'brief.pdf'}

const DROP_MESSAGE_VARIANTS = [
  {name: 'accepted', files: [PNG]},
  {name: 'partially-accepted', files: [PNG, PDF]},
  {name: 'rejected', files: [PDF]},
]

function DropMessageVariantsInput(props: ObjectInputProps) {
  const types = [props.schemaType]
  return (
    <Stack gap={3}>
      {DROP_MESSAGE_VARIANTS.map(({name, files}) => (
        <Card key={name} data-testid={`drop-message-${name}`} border radius={2} paddingX={3}>
          <DropMessage hoveringFiles={files} types={types} />
        </Card>
      ))}
    </Stack>
  )
}

function ImageUploadTargetInput(props: ObjectInputProps) {
  return (
    <ImageUploadTarget
      types={[props.schemaType]}
      data-testid="image-upload-target"
      border
      radius={2}
      padding={5}
    >
      <Text muted size={1}>
        Drag an image here
      </Text>
    </ImageUploadTarget>
  )
}

function createSchema(input: ComponentType<ObjectInputProps>) {
  return [
    defineType({
      type: 'document',
      name: 'test',
      title: 'Test',
      fields: [
        defineField({type: 'image', name: 'heroImage', title: 'Hero image', components: {input}}),
      ],
    }),
  ]
}

const DROP_MESSAGE_SCHEMA = createSchema(DropMessageVariantsInput)
const UPLOAD_TARGET_SCHEMA = createSchema(ImageUploadTargetInput)

function dragFilesOver(element: Element, files: File[]) {
  const dataTransfer = new DataTransfer()
  files.forEach((file) => dataTransfer.items.add(file))
  element.dispatchEvent(new DragEvent('dragenter', {bubbles: true, cancelable: true, dataTransfer}))
}

describe('upload target', () => {
  test('renders the drop message for accepted, partially accepted and rejected files', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <TestWrapper schemaTypes={DROP_MESSAGE_SCHEMA}>
        <TestForm />
      </TestWrapper>,
    )

    await expect
      .element(page.getByTestId('drop-message-accepted'))
      .toHaveTextContent('Drop to upload')
    await expect
      .element(page.getByTestId('drop-message-partially-accepted'))
      .toMatchTextContent("1 file can't be uploaded here")
    await expect
      .element(page.getByTestId('drop-message-rejected'))
      .toHaveTextContent("Can't upload this file here")
    await settleChromaticEndState()
  })

  test('shows the drop overlay while files are dragged over', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <TestWrapper schemaTypes={UPLOAD_TARGET_SCHEMA}>
        <TestForm />
      </TestWrapper>,
    )

    const target = page.getByTestId('image-upload-target')
    await expect.element(target).toBeVisible()

    dragFilesOver(target.element(), [
      new File([''], 'photo.png', {type: 'image/png'}),
      new File([''], 'brief.pdf', {type: 'application/pdf'}),
    ])

    await expect.element(target.getByTestId('upload-target-drop-message')).toBeVisible()
    await expect.element(target.getByText("1 file can't be uploaded here")).toBeVisible()
    await settleChromaticEndState()
  })
})
