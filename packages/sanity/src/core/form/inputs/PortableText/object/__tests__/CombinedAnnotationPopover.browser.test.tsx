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
import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {useEffect, useMemo, useRef, useState} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {useSchema} from '../../../../../hooks/useSchema'
import {
  SelectedAnnotationsProvider,
  useSelectedAnnotations,
} from '../../contexts/SelectedAnnotationsContext'
import {CombinedAnnotationPopover} from '../CombinedAnnotationPopover'

const SCHEMA_TYPES = [
  defineType({
    type: 'object',
    name: 'link',
    title: 'Link',
    fields: [defineField({type: 'url', name: 'href', title: 'URL'})],
  }),
  defineType({
    type: 'object',
    name: 'highlight',
    title: 'Highlight',
    fields: [defineField({type: 'string', name: 'color', title: 'Color'})],
  }),
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
            marks: {annotations: [{type: 'link'}, {type: 'highlight'}]},
          }),
        ],
      }),
    ],
  }),
]

/**
 * Stands in for the editor's `Annotation` components: registers two
 * annotations that cover the same span, the way overlapping marks do, so the
 * popover lists both.
 */
function AnnotatedText() {
  const schema = useSchema()
  const linkType = schema.get('link') as ObjectSchemaType
  const highlightType = schema.get('highlight') as ObjectSchemaType
  const {register, unregister} = useSelectedAnnotations()
  const [element, setElement] = useState<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (!element) return undefined
    register({
      key: 'link-1',
      title: 'Link',
      schemaType: linkType,
      onOpen: noop,
      onRemove: noop,
      referenceElement: element,
    })
    register({
      key: 'highlight-1',
      title: 'Highlight',
      schemaType: highlightType,
      onOpen: noop,
      onRemove: noop,
      referenceElement: element,
    })
    return () => {
      unregister('link-1')
      unregister('highlight-1')
    }
  }, [element, highlightType, linkType, register, unregister])

  return (
    <Text>
      Text with an{' '}
      <span data-testid="annotated-text" ref={setElement} style={{textDecoration: 'underline'}}>
        annotated phrase
      </span>{' '}
      in the middle.
    </Text>
  )
}

function CombinedAnnotationToolbar() {
  const schema = useSchema()
  const documentType = schema.get('test') as ObjectSchemaType
  const bodyType = documentType.fields[0].type as ArraySchemaType<PortableTextBlock>
  const initialConfig = useMemo(
    () => ({schemaDefinition: sanitySchemaToPortableTextSchema(bodyType)}),
    [bodyType],
  )
  const annotationOpeningRef = useRef(false)
  const [boundaryElement, setBoundaryElement] = useState<HTMLDivElement | null>(null)

  return (
    <EditorProvider initialConfig={initialConfig}>
      <SelectedAnnotationsProvider>
        <div ref={setBoundaryElement} style={{paddingTop: 120}}>
          <Card border padding={4} radius={2}>
            <AnnotatedText />
          </Card>
        </div>
        <CombinedAnnotationPopover
          annotationOpeningRef={annotationOpeningRef}
          referenceBoundary={boundaryElement}
        />
      </SelectedAnnotationsProvider>
    </EditorProvider>
  )
}

function CombinedAnnotationPopoverHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <CombinedAnnotationToolbar />
    </TestWrapper>
  )
}

/** Puts a collapsed DOM selection (a caret) inside the annotated span. */
function placeCaretIn(element: Element, offset: number) {
  const range = window.document.createRange()
  range.setStart(element.firstChild!, offset)
  range.collapse(true)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
}

describe('Portable Text combined annotation popover', () => {
  it('lists every annotation under the caret with edit and remove actions', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<CombinedAnnotationPopoverHarness />)

    const $annotated = page.getByTestId('annotated-text')
    await expect.element($annotated).toBeVisible()
    placeCaretIn($annotated.element(), 4)

    const $popover = page.getByTestId('annotation-toolbar-popover')
    await expect.element($popover).toBeVisible()
    await expect.element($popover.getByText('Link', {exact: true})).toBeVisible()
    await expect.element($popover.getByText('Highlight', {exact: true})).toBeVisible()
    await expect.element($popover.getByTestId('edit-annotation-button')).toBeVisible()
    await expect.element($popover.getByTestId('remove-annotation-button-1')).toBeVisible()
    // Parking the pointer does not move the caret, so the popover stays open.
    await settleChromaticEndState()
    await expect.element($popover).toBeVisible()
  })
})
