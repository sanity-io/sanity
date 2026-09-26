/**
 * The PTE `Compositor` re-provides the pane's portal (so object edit popovers and dialogs render
 * into it) and, in fullscreen, replaces the pane's declared portal boundary with its own scroll
 * element so popovers that escape those dialogs stay below the fullscreen toolbar. Both paths run
 * through the real editor here: a probe input inside a link annotation reports the boundary that
 * reference results would get.
 */
import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {BoundaryElementProvider, PortalProvider} from '@sanity/ui'
import {type ReactNode, useLayoutEffect, useMemo, useState} from 'react'
import {type StringInputProps} from 'sanity'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {PortalBoundaryProvider} from '../../../../components/portalBoundary/PortalBoundaryProvider'
import {useReferenceAutocompletePopoverBoundary} from '../../../hooks/useReferenceAutocompletePopoverBoundary'

const captured: {boundary: HTMLElement | null | undefined} = {boundary: undefined}
const pane: {scroller: HTMLElement | null} = {scroller: null}

/** Stands in for the reference input inside the annotation: reports the boundary it would get. */
function ProbeInput(props: StringInputProps) {
  const [probe, setProbe] = useState<HTMLDivElement | null>(null)
  const boundary = useReferenceAutocompletePopoverBoundary(probe)
  useLayoutEffect(() => {
    if (probe) captured.boundary = boundary
  }, [boundary, probe])
  return (
    <>
      <div ref={setProbe} data-testid="boundary-probe" />
      {props.renderDefault(props)}
    </>
  )
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
                {
                  type: 'object',
                  name: 'link',
                  title: 'Link',
                  fields: [
                    defineField({
                      type: 'string',
                      name: 'href',
                      title: 'Link',
                      components: {input: ProbeInput},
                    }),
                  ],
                },
              ],
            },
          }),
        ],
      }),
    ],
  }),
]

/**
 * The document pane reduced to what matters: a scroll container that is the ambient and the
 * declared portal boundary, and a portal target beside it. `default` maps to that portal the way
 * the Compositor maps it, and the fullscreen editor's layer fills the surrounding box.
 */
function Pane(props: {children: ReactNode}) {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const elements = useMemo(() => ({default: portalElement}), [portalElement])
  useLayoutEffect(() => {
    pane.scroller = scroller
  }, [scroller])
  return (
    <div style={{position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column'}}>
      <PortalBoundaryProvider element={scroller} portalElement={portalElement}>
        <PortalProvider element={portalElement} __unstable_elements={elements}>
          <BoundaryElementProvider element={scroller}>
            <div
              ref={setScroller}
              data-testid="pane-scroller"
              style={{flex: 1, overflow: 'auto', position: 'relative'}}
            >
              {portalElement ? props.children : null}
            </div>
          </BoundaryElementProvider>
        </PortalProvider>
      </PortalBoundaryProvider>
      <div ref={setPortalElement} data-testid="pane-portal" />
    </div>
  )
}

function Harness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Pane>
        <TestForm />
      </Pane>
    </TestWrapper>
  )
}

async function openLinkAnnotation() {
  const {extendPortableTextSelection, getFocusedPortableTextEditor, insertPortableText} =
    testHelpers()
  void render(<Harness />)
  const $pte = await getFocusedPortableTextEditor('field-body')

  await insertPortableText('Portal boundary link', $pte)
  // One Shift+ArrowLeft per editor sync window: four presses in a row race the
  // editor's throttled selection sync, which annotated just "k" in some runs.
  await extendPortableTextSelection('link', {reverse: true})
  await page.getByRole('button', {name: 'Link'}).click()

  const $linkInput = page.getByTestId('popover-edit-dialog').getByLabelText('Link')
  await expect.element($linkInput).toBeVisible()
  return $linkInput
}

describe('Portable Text Input', () => {
  describe('Portal boundary', () => {
    it(
      'popovers escaping an annotation popover are bounded by the pane',
      {timeout: 30_000},
      async () => {
        const {settleChromaticEndState} = testHelpers()
        captured.boundary = undefined
        const $linkInput = await openLinkAnnotation()

        await expect.poll(() => captured.boundary).toBe(pane.scroller)
        expect(pane.scroller).not.toBeNull()

        // The Link toolbar button that opened the dialog keeps focus, and its
        // tooltip with it. Focus the dialog's own input so the archived state
        // is the open dialog rather than a tooltip mid-open-delay.
        $linkInput.element().focus()
        await expect.element($linkInput).toHaveFocus()
        await settleChromaticEndState()
      },
    )

    it(
      'in fullscreen they are bounded by the editor scroll element instead',
      {timeout: 30_000},
      async () => {
        const {settleChromaticEndState} = testHelpers()
        captured.boundary = undefined
        const $linkInput = await openLinkAnnotation()
        await $linkInput.fill('https://www.sanity.io')
        await page.getByLabelText('Expand editor').click()
        await expect
          .element(page.getByTestId('pt-editor'))
          .toHaveAttribute('data-fullscreen', 'true')
        await expect.element($linkInput).toBeVisible()

        const editorScroller = document.querySelector<HTMLElement>(
          '[data-testid="pt-editor"] [data-testid="pt-editor__scroller"]',
        )
        expect(editorScroller).not.toBeNull()
        await expect.poll(() => captured.boundary).toBe(editorScroller)
        await settleChromaticEndState()
      },
    )
  })
})
