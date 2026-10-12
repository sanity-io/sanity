import {configure} from '@chromatic-com/vitest'
import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {useEffect} from 'react'
import {type BlockAnnotationProps, type ObjectInputProps} from 'sanity'
import {beforeEach, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

// Behavioural guard, not a visual one: the end states (a caret after typed
// text, a focused URL input) are already covered by the Annotations suite.
configure({disableAutoSnapshot: true})

/**
 * Mount/unmount tally per probe. A keystroke that remounted the annotation
 * subtree (the `Annotation` component in the editor, or the annotation's input
 * inside `AnnotationObjectEditModal`) would show up as an extra `mount` with a
 * matching `unmount`, so every assertion compares against the tally taken right
 * before typing.
 */
const lifecycle = {
  annotation: {mount: 0, unmount: 0},
  annotationInput: {mount: 0, unmount: 0},
}

function useLifecycleProbe(name: keyof typeof lifecycle) {
  useEffect(() => {
    lifecycle[name].mount += 1
    return () => {
      lifecycle[name].unmount += 1
    }
  }, [name])
}

function AnnotationProbe(props: BlockAnnotationProps) {
  // `renderDefault` for annotations is `DefaultAnnotationComponent` called
  // inline, so its hooks run as part of this render. The compiled test build
  // would otherwise memoize that call on `props` and skip the hooks on a
  // context-driven re-render ("Rendered fewer hooks than expected").
  'use no memo'
  useLifecycleProbe('annotation')
  return props.renderDefault(props)
}

function AnnotationInputProbe(props: ObjectInputProps) {
  useLifecycleProbe('annotationInput')
  return <div data-testid="annotation-input-probe">{props.renderDefault(props)}</div>
}

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        of: [
          defineArrayMember({
            type: 'block',
            marks: {
              annotations: [
                defineArrayMember({
                  type: 'object',
                  name: 'link',
                  title: 'Link',
                  fields: [defineField({type: 'string', name: 'href', title: 'URL'})],
                  components: {
                    annotation: AnnotationProbe,
                    input: AnnotationInputProbe,
                  },
                }),
              ],
            },
          }),
        ],
      }),
    ],
  }),
]

const ANNOTATION_PATH = ['body', {_key: 'a'}, 'markDefs', {_key: 'l1'}]

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: '123',
  body: [
    {
      _key: 'a',
      _type: 'block',
      style: 'normal',
      markDefs: [{_key: 'l1', _type: 'link', href: 'https://example.com'}],
      children: [
        {_key: 's1', _type: 'span', text: 'Keystrokes keep the ', marks: []},
        {_key: 's2', _type: 'span', text: 'annotation', marks: ['l1']},
        {_key: 's3', _type: 'span', text: ' mounted. ', marks: []},
      ],
    },
  ],
}

function KeystrokeRemountHarness(props: {focusPath?: typeof ANNOTATION_PATH}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={document} focusPath={props.focusPath} />
    </TestWrapper>
  )
}

describe('Portable Text Input', () => {
  describe('Keystrokes keep the annotation subtree mounted', () => {
    beforeEach(() => {
      lifecycle.annotation = {mount: 0, unmount: 0}
      lifecycle.annotationInput = {mount: 0, unmount: 0}
    })

    it('typing in the editor does not remount the editor or the annotation', async () => {
      const {getFocusedPortableTextEditor, typeWithDelay, waitForDocumentState} = testHelpers()
      void render(<KeystrokeRemountHarness />)
      const $pte = await getFocusedPortableTextEditor('field-body')
      const $annotation = page.elementLocator($pte.element().querySelector('span[data-link]')!)
      await expect.element($annotation).toMatchTextContent(/^annotation$/)

      // The editor root is a sibling of `AnnotationObjectEditModal` inside the
      // same `Portal`: if that subtree were torn down on a keystroke, this
      // element would be replaced along with it.
      const editorRoot = page.getByTestId('pt-editor').element()
      const before = structuredClone(lifecycle)

      // Caret at the end of the block that holds the annotation, then type.
      await userEvent.click($pte)
      await userEvent.keyboard('{End}')
      await typeWithDelay('abc')
      await waitForDocumentState((state) =>
        state.body?.[0]?.children?.at(-1)?.text?.endsWith('abc'),
      )

      await expect.element($pte).toHaveFocus()
      expect(page.getByTestId('pt-editor').element()).toBe(editorRoot)
      expect(editorRoot.isConnected).toBe(true)
      expect(lifecycle.annotation).toEqual(before.annotation)
      expect(lifecycle.annotationInput).toEqual(before.annotationInput)
    })

    it('typing in the annotation edit modal does not remount the modal', async () => {
      const {typeWithDelay} = testHelpers()
      void render(<KeystrokeRemountHarness focusPath={ANNOTATION_PATH} />)
      const $dialog = page.getByTestId('popover-edit-dialog')
      const $input = $dialog.getByLabelText('URL')
      await expect.element($input).toBeVisible()
      await expect.element($input).toHaveValue('https://example.com')
      await expect.element(page.getByTestId('annotation-input-probe')).toBeVisible()

      const dialogElement = $dialog.element()
      const inputElement = $input.element()
      $input.element().focus()
      await expect.element($input).toHaveFocus()
      const before = structuredClone(lifecycle)

      await userEvent.keyboard('{End}')
      await typeWithDelay('/docs')
      await expect.element($input).toHaveValue('https://example.com/docs')

      // Focus and the DOM nodes survive every keystroke, and the probe mounted
      // once: the modal subtree was updated in place, not rebuilt.
      await expect.element($input).toHaveFocus()
      expect($dialog.element()).toBe(dialogElement)
      expect($input.element()).toBe(inputElement)
      expect(lifecycle.annotationInput).toEqual(before.annotationInput)
      expect(lifecycle.annotationInput.unmount).toBe(0)
      expect(lifecycle.annotation).toEqual(before.annotation)
    })
  })
})
