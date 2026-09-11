import {configure, takeSnapshot} from '@chromatic-com/vitest'
import {ColorWheelIcon} from '@sanity/icons/ColorWheel'
import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, server, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

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
          }),
        ],
      }),
    ],
  }),
]

function AnnotationsHarness() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </TestWrapper>
  )
}

const MULTIPLE_ANNOTATIONS_SCHEMA_TYPES = [
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
                    }),
                  ],
                },
                {
                  type: 'object',
                  name: 'highlight',
                  title: 'Highlight',
                  icon: ColorWheelIcon,
                  fields: [
                    defineField({
                      type: 'string',
                      name: 'color',
                      title: 'Color',
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

function MultipleAnnotationsHarness() {
  return (
    <TestWrapper schemaTypes={MULTIPLE_ANNOTATIONS_SCHEMA_TYPES}>
      <TestForm />
    </TestWrapper>
  )
}

/**
 * Pointer `position` (relative to `element`'s box) at the center of the first
 * occurrence of `word` in its text, so a click lands on that word rather than
 * on whatever happens to sit at the element's center.
 */
function positionOfWord(element: Element, word: string): {x: number; y: number} {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const index = node.textContent?.indexOf(word) ?? -1
    if (index === -1) continue
    const range = document.createRange()
    range.setStart(node, index)
    range.setEnd(node, index + word.length)
    const wordRect = range.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    return {
      x: wordRect.left - elementRect.left + wordRect.width / 2,
      y: wordRect.top - elementRect.top + wordRect.height / 2,
    }
  }
  throw new Error(`"${word}" not found in ${JSON.stringify(element.textContent)}`)
}

// vitest-browser's `.not.toBeVisible()` throws on a missing element, so this
// treats the popover being unmounted the same as it being hidden.
async function expectPopoverAbsentOrHidden() {
  await expect
    .poll(() => {
      const popover = document.querySelector<HTMLElement>(
        '[data-testid="annotation-toolbar-popover"]',
      )
      return !popover || !popover.checkVisibility()
    })
    .toBe(true)
}

describe('Portable Text Input', () => {
  describe('Annotations', () => {
    // Firefox's tab order from the PTE does not reach the annotation toolbar
    // popover buttons the way Chromium/WebKit do: {Tab} doesn't land focus on
    // edit-annotation-button even though it's mounted and visible, so the focus
    // assertions hang. Same class of Firefox PTE keyboard quirk the sibling
    // tests below skip for.
    it.skipIf(server.browser === 'firefox')('Create a new link with keyboard only', async () => {
      const {
        getFocusedPortableTextEditor,
        insertPortableText,
        settleChromaticEndState,
        extendPortableTextSelection,
        waitForPortableTextSelection,
      } = testHelpers()
      void render(<AnnotationsHarness />)
      const $pte = await getFocusedPortableTextEditor('field-body')

      await insertPortableText('Now we should insert a link.', $pte)

      // Backtrack and click link icon in menu bar
      await userEvent.keyboard('{ArrowLeft}')
      await extendPortableTextSelection('link', {reverse: true})
      await page.getByRole('button', {name: 'Link'}).click()
      // Assertion: Wait for link to be re-rendered / PTE internal state to be done
      const $link = page.elementLocator($pte.element().querySelector('span[data-link]')!)
      await expect.element($link).toBeVisible()
      await expect.element($link).toHaveTextContent(/^link$/)

      // Assertion: the annotation toolbar popover should not be present yet.
      // (vitest-browser's `.not.toBeVisible()` throws on a missing element, so
      // assert absence with `.not.toBeInTheDocument()`.)
      await expect.element(page.getByTestId('annotation-toolbar-popover')).not.toBeInTheDocument()

      const $linkEditPopover = page.getByTestId('popover-edit-dialog')
      const $linkInput = $linkEditPopover.getByLabelText('Link')

      // Now we check if the edit popover shows automatically
      await expect.element($linkInput).toBeInTheDocument()

      // Focus the URL input
      await $linkInput.element().focus()

      // Assertion: The URL input should be focused
      await expect.element($linkInput).toHaveFocus()

      // Type in the URL
      await userEvent.keyboard('https://www.sanity.io')

      // Assertion: The URL input should have the correct value
      await expect.element($linkInput).toHaveValue('https://www.sanity.io')

      // Close the popover
      await userEvent.keyboard('{Escape}')

      // Expect the editor to have focus after closing the popover
      await expect.element($pte).toHaveFocus()

      const $toolbarPopover = page.getByTestId('annotation-toolbar-popover')

      // Collapse the selection to a caret inside the annotation, letting the
      // editor pick up each caret move before the next keystroke (its
      // `validateSelection` otherwise writes the stale caret back over it).
      await userEvent.keyboard('{ArrowLeft}')
      await waitForPortableTextSelection('')
      await userEvent.keyboard('{ArrowRight}')

      // Assertion: the annotation toolbar popover should be visible
      await expect.element($toolbarPopover).toBeVisible()

      // Expand the selection by one character while staying inside the annotation.
      await waitForPortableTextSelection('')
      await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}')
      await waitForPortableTextSelection('i')

      // Assertion: an expanded selection inside the annotation hides the popover.
      await expectPopoverAbsentOrHidden()

      // Collapse again so the popover is visible for tabbing into its buttons.
      await userEvent.keyboard('{ArrowLeft}')
      await expect.element($toolbarPopover).toBeVisible()

      // Wait for the popover's focusable buttons to be mounted before tabbing.
      // Asserting the popover is "visible" doesn't guarantee its buttons are in
      // the tab order yet; pressing Tab too early (notably in Firefox) moves
      // focus to a transient target, and toHaveFocus() can't recover since the
      // keystroke already fired.
      await expect.element(page.getByTestId('edit-annotation-button')).toBeVisible()
      await expect.element(page.getByTestId('remove-annotation-button')).toBeVisible()

      // Assertion: tab works to get to the toolbar popover buttons
      await userEvent.keyboard('{Tab}')
      await expect.element(page.getByTestId('edit-annotation-button')).toHaveFocus()
      await userEvent.keyboard('{Tab}')
      await expect.element(page.getByTestId('remove-annotation-button')).toHaveFocus()
      await userEvent.keyboard('{Escape}')
      await expect.element($pte).toHaveFocus()
      await expect.element($toolbarPopover).toBeVisible()
      await new Promise((r) => setTimeout(r, 1000))
      await userEvent.keyboard('{Escape}')
      await new Promise((r) => setTimeout(r, 1000))
      // Assertion: escape closes the toolbar popover. Popovers keep their content mounted while
      // closed, so this asserts on visibility rather than on the element being removed.
      await expect.element($toolbarPopover).not.toBeVisible()

      // End state for the archive: pointer parked (not on the toolbar Link
      // button clicked earlier), editor still focused, popover still closed.
      await settleChromaticEndState()
      await expect.element($pte).toHaveFocus()
      await expect.element($toolbarPopover).not.toBeVisible()
    })

    it(
      'Does not flash the annotation toolbar popover or show it while the edit popover is opening',
      {timeout: 30_000},
      async () => {
        // Auto end-state raced PTE focus-ring on vs off while the edit dialog
        // stayed open; snapshot the focused dialog explicitly.
        configure({disableAutoSnapshot: true})
        const {
          getFocusedPortableTextEditor,
          insertPortableText,
          settleChromaticEndState,
          extendPortableTextSelection,
        } = testHelpers()
        void render(<AnnotationsHarness />)
        const $pte = await getFocusedPortableTextEditor('field-body')

        await insertPortableText('Now we should insert a link.', $pte)

        // Backtrack and select the word "link"
        await userEvent.keyboard('{ArrowLeft}')
        await extendPortableTextSelection('link', {reverse: true})

        // Watch the DOM continuously between clicking the toolbar button and
        // the edit popover opening: the annotation toolbar popover must never
        // become visible in that window (SAPP-2645).
        let toolbarPopoverAppeared = false
        const observer = new MutationObserver(() => {
          const popover = document.querySelector<HTMLElement>(
            '[data-testid="annotation-toolbar-popover"]',
          )
          if (popover?.checkVisibility()) {
            toolbarPopoverAppeared = true
          }
        })
        observer.observe(document.body, {
          attributes: true,
          childList: true,
          subtree: true,
        })

        try {
          await page.getByRole('button', {name: 'Link'}).click()

          // Wait for the annotation to be rendered and the edit popover to open.
          const $link = page.elementLocator($pte.element().querySelector('span[data-link]')!)
          await expect.element($link).toBeVisible()
          await expect.element($link).toHaveTextContent(/^link$/)
          const $linkInput = page.getByTestId('popover-edit-dialog').getByLabelText('Link')
          await expect.element($linkInput).toBeVisible()
        } finally {
          observer.disconnect()
        }

        // Assertion: the toolbar popover never appeared while the edit popover was opening
        expect(toolbarPopoverAppeared).toBe(false)

        const $linkInput = page.getByTestId('popover-edit-dialog').getByLabelText('Link')
        await $linkInput.element().focus()
        await expect.element($linkInput).toHaveFocus()
        // Clear the PTE text selection so the annotated span never archives
        // with a selection highlight, then park the real pointer (it is still
        // on the Link toolbar button). The dialog only closes on mousedown
        // outside, so a hover onto the park does not dismiss it — and the
        // settle helper fails if it did.
        window.getSelection()?.removeAllRanges()
        await settleChromaticEndState()
        await expect.element(page.getByTestId('popover-edit-dialog')).toBeVisible()
        await expect.element($linkInput).toHaveFocus()
        await takeSnapshot('no-toolbar-flash-edit-dialog-open')
      },
    )

    it(
      'Can create, and then open the existing annotation again for editing',
      {timeout: 30_000},
      async () => {
        // Auto end-state sometimes archives after the edit dialog has already
        // closed; snapshot while it is open and focused instead.
        configure({disableAutoSnapshot: true})
        const {
          getFocusedPortableTextEditor,
          insertPortableText,
          settleChromaticEndState,
          extendPortableTextSelection,
          waitForPortableTextSelection,
        } = testHelpers()
        void render(<AnnotationsHarness />)
        const $pte = await getFocusedPortableTextEditor('field-body')

        await insertPortableText('Now we should insert a link.', $pte)

        // Backtrack and click link icon in menu bar
        await userEvent.keyboard('{ArrowLeft}')
        await extendPortableTextSelection('link', {reverse: true})
        await page.getByRole('button', {name: 'Link'}).click()
        // Assertion: Wait for link to be re-rendered / PTE internal state to be done.
        // The annotation must cover exactly "link": it is the reference the
        // edit popover is positioned from, so "ink" would archive differently.
        const $link = page.elementLocator($pte.element().querySelector('span[data-link]')!)
        await expect.element($link).toBeVisible()
        await expect.element($link).toHaveTextContent(/^link$/)

        // Assertion: the annotation toolbar popover should not be visible
        await expect.element(page.getByTestId('annotation-toolbar-popover')).not.toBeInTheDocument()

        const $linkEditPopover = page.getByTestId('popover-edit-dialog')
        const $linkInput = $linkEditPopover.getByLabelText('Link')

        // Now we check if the edit popover shows automatically
        await expect.element($linkInput).toBeInTheDocument()

        // Focus the URL input
        await $linkInput.element().focus()

        // Assertion: The URL input should be focused
        await expect.element($linkInput).toHaveFocus()

        // Type in the URL
        await userEvent.keyboard('https://www.sanity.io')

        // Assertion: The URL input should have the correct value
        await expect.element($linkInput).toHaveValue('https://www.sanity.io')

        // Close the popover
        await userEvent.keyboard('{Escape}')

        // Expect the editor to have focus after closing the popover
        await expect.element($pte).toHaveFocus()

        const $toolbarPopover = page.getByTestId('annotation-toolbar-popover')

        // Collapse the selection to a caret inside the annotation, letting the
        // editor pick up each caret move before the next keystroke (its
        // `validateSelection` otherwise writes the stale caret back over it).
        await userEvent.keyboard('{ArrowLeft}')
        await waitForPortableTextSelection('')
        await userEvent.keyboard('{ArrowRight}')

        // Assertion: the annotation toolbar popover should be visible
        await expect.element($toolbarPopover).toBeVisible()

        // Expand the selection by one character while staying inside the annotation.
        await waitForPortableTextSelection('')
        await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}')
        await waitForPortableTextSelection('i')

        // Assertion: an expanded selection inside the annotation hides the popover.
        await expectPopoverAbsentOrHidden()

        // Collapse again so the popover is visible for clicking the edit button.
        await userEvent.keyboard('{ArrowLeft}')
        await expect.element($toolbarPopover).toBeVisible()

        // Open up the editing interface again
        await page.getByTestId('edit-annotation-button').click()

        // Re-query the input since the popover was recreated
        const $linkInputReopened = page.getByTestId('popover-edit-dialog').getByLabelText('Link')
        await expect.element($linkInputReopened).toBeVisible()
        await expect.element($linkInputReopened).toBeEnabled()

        // Focus the URL input
        await $linkInputReopened.element().focus()

        // Assertion: The URL input should be focused
        await expect.element($linkInputReopened).toHaveFocus()
        // Clear any leftover PTE text selection so the annotated "link" span
        // does not archive with a selection highlight on some runs only, then
        // park the pointer that is still on the edit-annotation button. The
        // dialog closes on mousedown outside only; the settle helper fails if
        // the hover onto the park dismissed it.
        window.getSelection()?.removeAllRanges()
        await settleChromaticEndState()
        await expect.element(page.getByTestId('popover-edit-dialog')).toBeVisible()
        await expect.element($linkInputReopened).toHaveFocus()
        await takeSnapshot('edit-link-open')
      },
    )

    it('Can edit a root-level annotation in fullscreen', {timeout: 30_000}, async () => {
      // Auto end-state can archive after the edit dialog has already closed
      // (fullscreen + dialog open vs fullscreen alone). Snapshot while open.
      configure({disableAutoSnapshot: true})
      const {
        getFocusedPortableTextEditor,
        insertPortableText,
        settleChromaticEndState,
        extendPortableTextSelection,
      } = testHelpers()
      void render(<AnnotationsHarness />)
      const $pte = await getFocusedPortableTextEditor('field-body')

      await insertPortableText('Fullscreen link', $pte)
      await extendPortableTextSelection('link', {reverse: true})
      await page.getByRole('button', {name: 'Link'}).click()

      const $linkInput = page.getByTestId('popover-edit-dialog').getByLabelText('Link')
      await expect.element($linkInput).toBeVisible()
      const $link = page.elementLocator($pte.element().querySelector('span[data-link]')!)
      await expect.element($link).toHaveTextContent(/^link$/)
      await $linkInput.fill('https://www.sanity.io')
      await page.getByLabelText('Expand editor').click()

      await expect.element(page.getByTestId('pt-editor')).toHaveAttribute('data-fullscreen', 'true')
      await expect.element($linkInput).toBeVisible()
      await $linkInput.element().focus()
      await expect.element($linkInput).toHaveFocus()
      // Clear the PTE selection, then park the pointer that is still on the
      // Expand editor button. The dialog closes on mousedown outside only; the
      // settle helper fails if the hover onto the park dismissed it.
      window.getSelection()?.removeAllRanges()
      await settleChromaticEndState()
      await expect.element(page.getByTestId('popover-edit-dialog')).toBeVisible()
      await expect.element($linkInput).toHaveFocus()
      await takeSnapshot('fullscreen-edit-link-open')
    })

    it(
      'Shows the annotation popover for a collapsed caret but not an expanded selection inside the annotation',
      {timeout: 30_000},
      async () => {
        const {
          getFocusedPortableTextEditor,
          insertPortableText,
          settleChromaticEndState,
          extendPortableTextSelection,
          waitForPortableTextSelection,
        } = testHelpers()
        void render(<AnnotationsHarness />)
        const $pte = await getFocusedPortableTextEditor('field-body')

        await insertPortableText('Now we should insert a link.', $pte)

        // Backtrack and select the word "link"
        await userEvent.keyboard('{ArrowLeft}')
        await extendPortableTextSelection('link', {reverse: true})
        await page.getByRole('button', {name: 'Link'}).click()

        const $link = page.elementLocator($pte.element().querySelector('span[data-link]')!)
        await expect.element($link).toBeVisible()
        await expect.element($link).toHaveTextContent(/^link$/)

        const $linkInput = page.getByTestId('popover-edit-dialog').getByLabelText('Link')
        await expect.element($linkInput).toBeInTheDocument()
        await $linkInput.element().focus()
        await userEvent.keyboard('https://www.sanity.io')
        await userEvent.keyboard('{Escape}')

        // Expect the editor to have focus after closing the popover
        await expect.element($pte).toHaveFocus()

        const $toolbarPopover = page.getByTestId('annotation-toolbar-popover')

        // Collapse the selection to a caret inside the annotation (between
        // the first and second letter of "link"). Let the editor pick each
        // caret move up before the next keystroke: the re-render from that
        // sync runs `validateSelection`, which writes the editor's selection
        // back into the DOM when the two differ, so an arrow key landing
        // inside the throttle window gets undone (and a Shift+Arrow reopens
        // the popover).
        await userEvent.keyboard('{ArrowLeft}')
        await waitForPortableTextSelection('')
        await userEvent.keyboard('{ArrowRight}')

        // Assertion (positive control): a collapsed caret inside the
        // annotation shows the popover.
        await expect.element($toolbarPopover).toBeVisible()

        // Expand the selection by one character while staying inside the
        // annotation. The quiet wait sits right before the keystroke: the
        // render that shows the popover can still fire a `selectionchange`
        // (Firefox does so on DOM mutations around the caret), and one landing
        // within the throttle window would defer the sync of this keystroke.
        await waitForPortableTextSelection('')
        await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}')

        // Assertion: an expanded selection inside the annotation must hide
        // the popover. The popover hides from the DOM selection right away;
        // waiting for the editor to hold the same selection is what makes the
        // state final (see the caret wait above).
        await waitForPortableTextSelection('i')
        await expectPopoverAbsentOrHidden()

        // End state for the archive: pointer parked (not on the toolbar Link
        // button clicked earlier), editor still focused, popover still hidden
        // for the expanded selection.
        await settleChromaticEndState()
        await expect.element($pte).toHaveFocus()
        await expectPopoverAbsentOrHidden()
      },
    )

    // Firefox has timing issues with PTE selection events (matches the original
    // Playwright `test.skip(browserName === 'firefox')`).
    it.skipIf(server.browser === 'firefox')(
      'Shows combined popover with multiple annotations on same text',
      async () => {
        // Snapshot the combined toolbar explicitly — auto capture can race the
        // floating popover position / open state after the last Escape.
        configure({disableAutoSnapshot: true})
        const {
          getFocusedPortableTextEditor,
          insertPortableText,
          settleChromaticEndState,
          waitForPortableTextSelection,
        } = testHelpers()
        void render(<MultipleAnnotationsHarness />)
        const $pte = await getFocusedPortableTextEditor('field-body')

        await insertPortableText('Text with multiple annotations.', $pte)

        // Double-click on "annotations" to select it. The locator resolves to
        // the whole text span, so aim the pointer at the word itself: a
        // double-click at the element center lands on "multiple".
        const $text = $pte.getByText('Text with multiple annotations.')
        await userEvent.dblClick($text, {position: positionOfWord($text.element(), 'annotations')})
        await waitForPortableTextSelection('annotations')

        // Add link annotation
        await page.getByRole('button', {name: 'Link'}).click()
        const $linkSpan = page.elementLocator($pte.element().querySelector('span[data-link]')!)
        await expect.element($linkSpan).toBeVisible()
        await expect.element($linkSpan).toHaveTextContent(/^annotations$/)

        // Close the link edit popover
        const $linkEditPopover = page.getByTestId('popover-edit-dialog')
        const $linkInput = $linkEditPopover.getByLabelText('Link')
        await expect.element($linkInput).toBeInTheDocument()
        await $linkInput.element().focus()
        await userEvent.keyboard('https://www.sanity.io')
        await userEvent.keyboard('{Escape}')

        // Expect the editor to have focus after closing the popover
        await expect.element($pte).toHaveFocus()

        // Double-click on the linked text to reselect it and add highlight annotation
        // Use document.querySelector because after adding highlight, there will be nested span[data-link] elements
        const $linkedText = page.elementLocator($pte.element().querySelector('span[data-link]')!)
        await userEvent.dblClick($linkedText)
        // Without this the click below can run against the caret the editor
        // still holds from the Escape above, add nothing, and open no dialog.
        await waitForPortableTextSelection('annotations')

        // Add highlight annotation (the second annotation type)
        await page.getByRole('button', {name: 'Highlight'}).click()

        // Close the highlight edit popover
        const $highlightEditPopover = page.getByTestId('popover-edit-dialog')
        await expect.element($highlightEditPopover).toBeInTheDocument()
        const $stringInput = $highlightEditPopover.getByTestId('string-input')
        await expect.element($stringInput).toBeVisible()
        await expect.element($stringInput).toBeEnabled()
        await $stringInput.element().focus()
        await userEvent.keyboard('red')
        await userEvent.keyboard('{Escape}')

        // Expect the editor to have focus after closing the popover
        await expect.element($pte).toHaveFocus()

        // Click inside the doubly-annotated text and collapse the selection
        // to a caret to trigger the popover. The popover is positioned from
        // the caret, so each move must reach the editor before the next one
        // (its `validateSelection` would otherwise write the previous caret
        // back) and before the popover position is archived.
        const $linkedTextAgain = page.elementLocator(
          $pte.element().querySelector('span[data-link]')!,
        )
        await $linkedTextAgain.click()
        await waitForPortableTextSelection('')
        await userEvent.keyboard('{ArrowRight}')
        await waitForPortableTextSelection('')

        // Assertion: the combined annotation toolbar popover should be visible
        const $toolbarPopover = page.getByTestId('annotation-toolbar-popover')
        await expect.element($toolbarPopover).toBeVisible()

        // Assertion: both annotation types should be shown in the popover
        // The popover should contain "Link" and "Highlight" text
        await expect.element($toolbarPopover.getByText('Link')).toBeVisible()
        await expect.element($toolbarPopover.getByText('Highlight')).toBeVisible()

        // Assertion: both edit buttons should be present (first one without index, second with index 1)
        await expect.element(page.getByTestId('edit-annotation-button')).toBeVisible()
        await expect.element(page.getByTestId('edit-annotation-button-1')).toBeVisible()

        // Assertion: both remove buttons should be present
        await expect.element(page.getByTestId('remove-annotation-button')).toBeVisible()
        await expect.element(page.getByTestId('remove-annotation-button-1')).toBeVisible()

        // Editing one of the annotations must not reopen the toolbar popover
        // on top of the edit modal: the annotation that is not being edited
        // stays registered while the modal is open (SAPP-2645).
        await page.getByTestId('edit-annotation-button').click()
        // The popover either closes (kept mounted while other annotations are
        // registered) or unmounts entirely (no annotations registered).
        await expectPopoverAbsentOrHidden()

        let toolbarPopoverReappeared = false
        const observer = new MutationObserver(() => {
          const popover = document.querySelector<HTMLElement>(
            '[data-testid="annotation-toolbar-popover"]',
          )
          if (popover?.checkVisibility()) {
            toolbarPopoverReappeared = true
          }
        })
        observer.observe(document.body, {
          attributes: true,
          childList: true,
          subtree: true,
        })

        try {
          await expect.element(page.getByTestId('popover-edit-dialog')).toBeVisible()
          // Give the toolbar popover time to (incorrectly) reopen while the
          // edit modal settles and takes focus.
          await new Promise((resolve) => setTimeout(resolve, 1_000))
        } finally {
          observer.disconnect()
        }

        // Assertion: the toolbar popover never reappeared while the edit modal was open
        expect(toolbarPopoverReappeared).toBe(false)

        // Closing the modal brings the toolbar popover back for the
        // still-selected annotated text.
        await userEvent.keyboard('{Escape}')
        await expect.element($pte).toHaveFocus()
        await expect.element($toolbarPopover).toBeVisible()
        await expect.element(page.getByTestId('edit-annotation-button')).toBeVisible()
        await expect.element(page.getByTestId('edit-annotation-button-1')).toBeVisible()
        // The real pointer still sits on the edit button, so a toolbar tooltip
        // (e.g. "Underline") can be open; a synthetic `mouseover` on body does
        // not clear CSS `:hover`. Park the pointer, wait for tooltips to close
        // and for the toolbar popover to stop moving, then archive it open.
        await settleChromaticEndState()
        await expect.element($toolbarPopover).toBeVisible()
        await takeSnapshot('combined-toolbar-open')
      },
    )
  })
})
