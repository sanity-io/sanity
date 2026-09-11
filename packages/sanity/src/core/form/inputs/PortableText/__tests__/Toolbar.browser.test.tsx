import {configure, takeSnapshot} from '@chromatic-com/vitest'
import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {useMemo} from 'react'
import {type InputProps, type PortableTextInputProps} from 'sanity'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {expectStable, testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

interface ToolbarHarnessProps {
  id?: string
  ptInputProps?: Partial<PortableTextInputProps>
}

function ToolbarHarness(props: ToolbarHarnessProps) {
  const {id = 'root', ptInputProps} = props

  const schemaTypes = useMemo(
    () => [
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
                of: [
                  defineArrayMember({
                    type: 'object',
                    title: 'Inline Object',
                    fields: [
                      defineField({
                        type: 'string',
                        name: 'title',
                        title: 'Title',
                      }),
                    ],
                  }),
                ],
              }),
              defineArrayMember({
                name: 'object',
                type: 'object',
                title: 'Object',
                fields: [{type: 'string', name: 'title', title: 'Title'}],
                preview: {
                  select: {
                    title: 'title',
                  },
                },
              }),
              defineArrayMember({
                name: 'objectWithoutTitle',
                type: 'object',
                fields: [{type: 'string', name: 'title', title: 'Title'}],
                preview: {
                  select: {
                    title: 'title',
                  },
                },
              }),
              defineArrayMember({
                name: 'nested',
                type: 'object',
                fields: [
                  defineField({
                    name: 'items',
                    type: 'array',
                    of: [
                      defineArrayMember({
                        name: 'item',
                        type: 'object',
                        fields: [
                          defineField({
                            name: 'deep',
                            type: 'array',
                            of: [
                              defineArrayMember({
                                type: 'block',
                                styles: [
                                  {title: 'Normal', value: 'normal'},
                                  {title: 'H2', value: 'h2'},
                                  {title: 'H3', value: 'h3'},
                                  {title: 'H4', value: 'h4'},
                                ],
                              }),
                            ],
                            components: {
                              input: (inputProps: InputProps) => {
                                const editorProps = {
                                  ...inputProps,
                                  initialActive: false,
                                } as PortableTextInputProps
                                return inputProps.renderDefault(editorProps)
                              },
                            },
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],

            components: {
              input: (inputProps: InputProps) => {
                const editorProps = {
                  ...inputProps,
                  ...ptInputProps,
                } as PortableTextInputProps
                return inputProps.renderDefault(editorProps)
              },
            },
          }),
        ],
      }),
    ],
    [ptInputProps],
  )

  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm id={id} />
    </TestWrapper>
  )
}

describe('Portable Text Input', () => {
  describe('Toolbar', () => {
    describe('Adaptive size', () => {
      it('Overflow links should appear in the "Add" context menu', async () => {
        const {getFocusedPortableTextInput, settleChromaticEndState} = testHelpers()
        void render(<ToolbarHarness />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        // Adjust the viewport size to make the Inline Object button hidden
        await page.viewport(800, 1000)

        const $contextMenuButton = $portableTextInput.getByTestId('insert-menu-button')

        // Assertion: Check if the context menu button is showing
        await expect.element($contextMenuButton).toBeVisible()

        // Assertion: Check if the Inline Object button is now hidden (collapsed
        // into the overflow menu, so removed from the toolbar entirely)
        await expect
          .element(page.getByRole('button', {name: 'Inline Object'}))
          .not.toBeInTheDocument()

        await $contextMenuButton.click()

        // Assertion: Overflowing block link should appear in the "Add" menu button.
        // Menus keep their items mounted while closed, so read the one that is open.
        const openMenuText = () =>
          Array.from(
            window.document.querySelectorAll<HTMLElement>(
              '[data-ui="MenuButton__popover"] [data-ui="Menu"]',
            ),
          )
            .filter((menu) => menu.checkVisibility())
            .map((menu) => menu.textContent)
            .join('')
        await expect.poll(openMenuText).toContain('Inline Object')

        // End state for the archive: pointer parked (not on the "Add" trigger)
        // and the menu still open with the overflowed item afterwards.
        await settleChromaticEndState()
        expect(openMenuText()).toContain('Inline Object')
      })
    })

    describe('Collapsible toolbar', () => {
      describe('Root <FormBuilder>', () => {
        it('Toolbar should collapse when element width is less than 400px', async () => {
          const {getFocusedPortableTextInput, settleChromaticEndState} = testHelpers()
          void render(<ToolbarHarness id="root" />)
          const $portableTextInput = await getFocusedPortableTextInput('field-body')

          // Adjust viewport size to enable auto collapsing toolbar menus
          await page.viewport(450, 500)

          const $actionMenuAutoCollapseMenu = $portableTextInput.getByTestId(
            'action-menu-auto-collapse-menu',
          )
          const $insertMenuAutoCollapseMenu = $portableTextInput.getByTestId(
            'insert-menu-auto-collapse-menu',
          )

          // Assertion: all auto collapsing menu buttons should be visible
          await expect.element($actionMenuAutoCollapseMenu).toBeVisible()
          await expect.element($insertMenuAutoCollapseMenu).toBeVisible()

          // Adjust viewport size to disable auto collapsing toolbar menus
          await page.viewport(350, 500)

          // Assertion: all auto collapsing menu buttons should be hidden/removed
          await expect.element($actionMenuAutoCollapseMenu).not.toBeInTheDocument()
          await expect.element($insertMenuAutoCollapseMenu).not.toBeInTheDocument()

          // Let CollapseMenu finish measuring after the viewport change so
          // Chromatic does not archive a mid-reflow toolbar width.
          await expect
            .poll(() => $portableTextInput.element().getBoundingClientRect().width)
            .toBeLessThan(400)
          const toolbarSignature = () => {
            const toolbar = $portableTextInput
              .element()
              .querySelector('[data-testid="pt-editor__toolbar-card"]')
            if (!toolbar) return ''
            return Array.from(toolbar.querySelectorAll('button'))
              .map(
                (b) =>
                  `${b.getAttribute('data-testid') ?? b.textContent?.trim()}@${Math.round(b.getBoundingClientRect().width)}`,
              )
              .join('|')
          }
          expect(await expectStable(toolbarSignature)).not.toBe('')
          await settleChromaticEndState({
            styleSelectRoot: '[data-testid="field-body"]',
          })
        })
      })
      describe('Non-root <FormBuilder>', () => {
        it('Toolbar should not collapse when element width is less than 400px', async () => {
          const {getFocusedPortableTextInput, settleChromaticEndState} = testHelpers()
          void render(<ToolbarHarness id="inspector-panel" />)
          const $portableTextInput = await getFocusedPortableTextInput('field-body')

          await page.viewport(350, 500)

          const $actionMenuAutoCollapseMenu = $portableTextInput.getByTestId(
            'action-menu-auto-collapse-menu',
          )
          const $insertMenuAutoCollapseMenu = $portableTextInput.getByTestId(
            'insert-menu-auto-collapse-menu',
          )

          // Assertion: all auto collapsing menu buttons should be visible
          await expect.element($actionMenuAutoCollapseMenu).toBeVisible()
          await expect.element($insertMenuAutoCollapseMenu).toBeVisible()

          // Non-root CollapseMenu still measures after viewport shrink — wait
          // until an Object insert control is painted and button positions stop
          // moving (mid-measure archives flip between truncated "..." and "Obj").
          await expect
            .poll(() => {
              const toolbar = $portableTextInput
                .element()
                .querySelector('[data-testid="pt-editor__toolbar-card"]')
              return toolbar?.textContent ?? ''
            })
            .toMatch(/Obj|Object/)
          const toolbarSignature = () => {
            const toolbar = $portableTextInput
              .element()
              .querySelector('[data-testid="pt-editor__toolbar-card"]')
            if (!toolbar) return ''
            return Array.from(toolbar.querySelectorAll('button'))
              .map(
                (b) =>
                  `${b.getAttribute('data-testid') ?? b.textContent?.trim()}@${Math.round(b.getBoundingClientRect().x)}`,
              )
              .join('|')
          }
          await expect.poll(toolbarSignature).toMatch(/object-insert-menu-button/)
          expect(await expectStable(toolbarSignature)).toMatch(/object-insert-menu-button/)
          await settleChromaticEndState({
            styleSelectRoot: '[data-testid="field-body"]',
          })
        })
      })
    })

    describe('Hidden toolbar', () => {
      it('Toolbar should be hidden after activation', async () => {
        const {getFocusedPortableTextInput} = testHelpers()
        void render(<ToolbarHarness ptInputProps={{hideToolbar: true}} />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        const $toolbarCard = $portableTextInput.getByTestId('pt-editor__toolbar-card')
        // Assertion: the toolbar should not be rendered in the DOM
        await expect.element($toolbarCard).not.toBeInTheDocument()
      })
    })

    // TODO - needs rewrite to avoid flakiness
    describe('Opening block style', () => {
      it('on a simple editor', async () => {
        configure({disableAutoSnapshot: true})
        const {getFocusedPortableTextInput, settleChromaticEndState} = testHelpers()
        void render(<ToolbarHarness />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        const $toolbarCard = $portableTextInput.getByTestId('pt-editor__toolbar-card')

        // Assertion: all auto collapsing menu buttons should be visible
        await expect.element($toolbarCard).toBeVisible()

        // click the block style select
        await page.getByTestId('block-style-select').click()

        // Assertion: block style dropdown should be visible. Closed
        // `@sanity/ui` menus stay mounted (`display: none`), so a raw
        // querySelector is not enough for a deterministic Chromatic end state.
        await expect.element(page.getByRole('menuitem', {name: 'Normal'})).toBeVisible()
        await settleChromaticEndState()
        await expect.element(page.getByRole('menuitem', {name: 'Normal'})).toBeVisible()
        await takeSnapshot('simple-style-menu-open')
      })

      it('on a full screen simple editor', async () => {
        configure({disableAutoSnapshot: true})
        const {getFocusedPortableTextInput, settleChromaticEndState} = testHelpers()
        void render(<ToolbarHarness />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        const $toolbarCard = $portableTextInput.getByTestId('pt-editor__toolbar-card')

        // Assertion: all auto collapsing menu buttons should be visible
        await expect.element($toolbarCard).toBeVisible()

        // open the editor in full screen
        await $toolbarCard.getByLabelText('Expand editor').click()

        // click the block style select
        await page.getByTestId('block-style-select').click()

        // Assertion: block style dropdown should be visible. Closed
        // `@sanity/ui` menus stay mounted (`display: none`), so a raw
        // querySelector is not enough for a deterministic Chromatic end state.
        await expect.element(page.getByRole('menuitem', {name: 'Normal'})).toBeVisible()
        await settleChromaticEndState()
        await expect.element(page.getByRole('menuitem', {name: 'Normal'})).toBeVisible()
        await takeSnapshot('fullscreen-style-menu-open')
      })

      // Takes ~25s against the default 30s timeout on a healthy CI runner
      // (firefox), so any runner slowdown pushed it over the limit. Give it
      // explicit headroom instead.
      it('on a full screen multi nested PTE', {timeout: 90_000}, async () => {
        // Capture while the nested style menu is open — the automatic afterEach
        // snapshot sometimes archives after the menu has already closed.
        configure({disableAutoSnapshot: true})
        const {getFocusedPortableTextInput} = testHelpers()
        void render(<ToolbarHarness />)
        const $portableTextInput = await getFocusedPortableTextInput('field-body')

        const $toolbarCard = $portableTextInput.getByTestId('pt-editor__toolbar-card')

        // Assertion: all auto collapsing menu buttons should be visible
        await expect.element($toolbarCard).toBeVisible()

        // open the editor in full screen
        await $toolbarCard.getByLabelText('Expand editor').click()

        // prepare the nested PTE
        await page.getByRole('button', {name: 'Insert Nested (block)'}).click()

        await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

        await page.getByTestId('add-single-object-button').click()

        // nested PTE object item
        const untitledButtons = page.getByRole('button', {name: 'Untitled'}).elements()
        expect(untitledButtons.length).toBeGreaterThanOrEqual(2)

        // get the nested PTE
        const $overlay = page.getByTestId('activate-overlay')

        await $overlay.element().focus()
        await $overlay.click()

        // Nested editor must be present before we expand / open its style menu.
        // Soft `if (length >= 2)` skips used to let this test "pass" on the root
        // editor alone and archive an empty fullscreen Body for Chromatic.
        await expect
          .poll(
            () =>
              window.document.querySelectorAll('[data-testid="pt-editor__toolbar-card"]').length,
          )
          .toBeGreaterThanOrEqual(2)

        await expect
          .poll(() => window.document.querySelectorAll('[aria-label="Expand editor"]').length)
          .toBeGreaterThanOrEqual(2)
        const expandButtons = window.document.querySelectorAll('[aria-label="Expand editor"]')
        await userEvent.click(expandButtons[1] as HTMLElement)

        await expect
          .poll(() => window.document.querySelectorAll('[data-testid="block-style-select"]').length)
          .toBeGreaterThanOrEqual(2)
        const blockStyleSelects = window.document.querySelectorAll(
          '[data-testid="block-style-select"]',
        )
        // Prefer the last style select — nested fullscreen editors append after the root.
        const nestedStyleSelect = blockStyleSelects[blockStyleSelects.length - 1] as HTMLElement
        await userEvent.click(nestedStyleSelect)

        // Assertion: nested block style dropdown should be visibly open. Closed
        // `@sanity/ui` menus stay mounted (`display: none`), so a raw
        // querySelector / role match on a hidden item is not enough for Chromatic.
        await expect
          .poll(() =>
            Array.from(window.document.querySelectorAll('[role="menuitem"]')).some(
              (el) =>
                el instanceof HTMLElement &&
                el.checkVisibility() &&
                el.textContent?.trim() === 'Normal',
            ),
          )
          .toBe(true)

        // Park the pointer, require the open menu to stay open and stop moving,
        // and snap its Floating UI transform (the helper re-checks stability
        // after the snap). Without this, identical-code captures raced open vs
        // closed.
        const {settleChromaticEndState} = testHelpers()
        await settleChromaticEndState()
        // Item count and the menu rectangle must agree on consecutive reads; a
        // closed menu is a fresh Symbol each sample so it can never stabilize.
        const menuBox = () => {
          const items = Array.from(
            window.document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
          ).filter((el) => el.checkVisibility())
          const r = items[0]?.parentElement?.getBoundingClientRect()
          if (!r) return Symbol('menu closed')
          return `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)},${Math.round(r.height)},${items.length}`
        }
        await expectStable(menuBox)
        await expect
          .poll(() =>
            Array.from(window.document.querySelectorAll('[role="menuitem"]')).some(
              (el) =>
                el instanceof HTMLElement &&
                el.checkVisibility() &&
                el.textContent?.trim() === 'Normal',
            ),
          )
          .toBe(true)
        await takeSnapshot('nested-style-menu-open')
      })
    })
  })
})
