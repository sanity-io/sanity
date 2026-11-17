import {EditorProvider} from '@portabletext/editor'
import {sanitySchemaToPortableTextSchema} from '@portabletext/sanity-bridge'
import {
  type ArraySchemaType,
  defineArrayMember,
  defineField,
  defineType,
  type ObjectSchemaType,
  type PortableTextBlock,
} from '@sanity/types'
import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {useMemo, useState} from 'react'
import {Text} from 'ui5'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {useSchema} from '../../../../../hooks/useSchema'
import {InlineObjectToolbarPopover} from '../InlineObjectToolbarPopover'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        title: 'Body',
        of: [
          defineArrayMember({
            type: 'block',
            of: [
              defineArrayMember({
                type: 'object',
                name: 'inlineNote',
                title: 'Inline note',
                fields: [defineField({type: 'string', name: 'text', title: 'Text'})],
              }),
            ],
          }),
        ],
      }),
    ],
  }),
]

/**
 * The toolbar popover anchors to whatever element the inline object hands it
 * and only needs the editor context for returning focus, so it is rendered on
 * its own against a plain span instead of through an editor.
 */
function InlineObjectToolbar() {
  const schema = useSchema()
  const documentType = schema.get('test') as ObjectSchemaType
  const bodyType = documentType.fields[0].type as ArraySchemaType<PortableTextBlock>
  const initialConfig = useMemo(
    () => ({schemaDefinition: sanitySchemaToPortableTextSchema(bodyType)}),
    [bodyType],
  )
  const [boundaryElement, setBoundaryElement] = useState<HTMLDivElement | null>(null)
  const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(null)

  return (
    <EditorProvider initialConfig={initialConfig}>
      <div ref={setBoundaryElement} style={{paddingTop: 80}}>
        <Card border padding={4} radius={2}>
          <Text as="div" trim={true}>
            Text with an{' '}
            <span data-testid="inline-object" ref={setReferenceElement}>
              [inline note]
            </span>{' '}
            in the middle.
          </Text>
        </Card>
      </div>
      <InlineObjectToolbarPopover
        floatingBoundary={boundaryElement}
        inlineObjectFocused
        inlineObjectOpen={false}
        onOpenInlineObject={noop}
        onRemoveInlineObject={noop}
        referenceBoundary={boundaryElement}
        referenceElement={referenceElement}
        title="Inline note"
      />
    </EditorProvider>
  )
}

function InlineObjectToolbarPopoverHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <InlineObjectToolbar />
    </TestWrapper>
  )
}

describe('Portable Text inline object toolbar popover', () => {
  it('shows the title with edit and remove actions above a focused inline object', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<InlineObjectToolbarPopoverHarness />)

    const $popover = page.getByTestId('inline-object-toolbar-popover')
    await expect.element($popover).toBeVisible()
    await expect.element($popover.getByText('Inline note')).toBeVisible()
    await expect.element($popover.getByTestId('edit-inline-object-button')).toBeVisible()
    await expect.element($popover.getByTestId('remove-inline-object-button')).toBeVisible()
    await settleChromaticEndState()
  })
})
