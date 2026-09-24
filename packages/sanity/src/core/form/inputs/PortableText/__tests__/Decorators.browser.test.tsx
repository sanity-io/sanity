import {BulbOutlineIcon} from '@sanity/icons/BulbOutline'
import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type BlockDecoratorProps} from '../../../types/blockProps'

function Highlight(props: BlockDecoratorProps) {
  return (
    <span
      data-testid="custom-highlight-decorator"
      data-title={props.title}
      data-value={props.value}
    >
      {props.renderDefault(props)}
    </span>
  )
}

function Spoiler(props: BlockDecoratorProps) {
  return (
    <span data-testid="custom-spoiler-decorator" style={{color: 'red'}}>
      {props.children}
    </span>
  )
}

function DarkCode(props: BlockDecoratorProps) {
  return (
    <Card as="span" data-testid="dark-code-decorator" scheme="dark">
      {props.renderDefault(props)}
    </Card>
  )
}

const DEFAULT_DECORATORS_FIELD = defineField({
  type: 'array',
  name: 'defaultDecorators',
  of: [
    defineArrayMember({
      type: 'block',
    }),
  ],
})

const CUSTOM_DECORATOR_FIELD = defineField({
  type: 'array',
  name: 'customDecorator',
  of: [
    defineArrayMember({
      type: 'block',
      marks: {
        decorators: [
          {
            title: 'Highlight',
            value: 'highlight',
            icon: BulbOutlineIcon,
            component: Highlight,
          },
          {
            title: 'Spoiler',
            value: 'spoiler',
            component: Spoiler,
          },
        ],
      },
    }),
  ],
})

const DARK_CODE_DECORATOR_FIELD = defineField({
  type: 'array',
  name: 'darkCodeDecorator',
  of: [
    defineArrayMember({
      type: 'block',
      marks: {
        decorators: [{title: 'Code', value: 'code', component: DarkCode}],
      },
    }),
  ],
})

/** Mount only the field under test — a sibling empty PTE's style select
 * otherwise flips Normal ↔ No style and shifts Chromatic captures. */
function DecoratorsHarness({
  fields,
}: {
  fields: Array<'defaultDecorators' | 'customDecorator' | 'darkCodeDecorator'>
}) {
  const schemaFields = fields.map((name) => {
    if (name === 'defaultDecorators') return DEFAULT_DECORATORS_FIELD
    if (name === 'customDecorator') return CUSTOM_DECORATOR_FIELD
    return DARK_CODE_DECORATOR_FIELD
  })
  const schemaTypes = [
    defineType({
      type: 'document',
      name: 'test',
      title: 'Test',
      fields: schemaFields,
    }),
  ]
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm />
    </TestWrapper>
  )
}

const DEFAULT_DECORATORS = [
  {
    name: 'strong',
    title: 'Strong',
    hotkey: 'b',
    icon: 'bold',
  },
  {
    name: 'em',
    title: 'Italic',
    hotkey: 'i',
    icon: 'italic',
  },
  {
    name: 'underline',
    title: 'Underline',
    hotkey: 'u',
    icon: 'underline',
  },
  {
    name: 'code',
    title: 'Code',
    hotkey: "'",
    icon: 'code',
  },
  {
    name: 'strike-through',
    title: 'Strike',
    hotkey: undefined, // Currently not defined
    icon: 'strikethrough',
  },
]

describe('Portable Text Input', () => {
  describe('Decorators', () => {
    it('Render default decorators with keyboard shortcuts', async () => {
      const {
        findBySelector,
        getModifierKey,
        getFocusedPortableTextEditor,
        getFocusedPortableTextInput,
        insertPortableText,
        settleChromaticEndState,
        toggleHotkey,
      } = testHelpers()
      void render(<DecoratorsHarness fields={['defaultDecorators']} />)
      const $portableTextInput = await getFocusedPortableTextInput('field-defaultDecorators')
      const $pte = await getFocusedPortableTextEditor('field-defaultDecorators')
      const modifierKey = getModifierKey()

      for (const decorator of DEFAULT_DECORATORS) {
        if (decorator.hotkey) {
          // Turn on the decorator
          await toggleHotkey(decorator.hotkey, modifierKey)
          // Assertion: button was toggled
          const $selectedButton = await findBySelector(
            $portableTextInput,
            `button[data-testid="action-button-${decorator.name}"][data-selected]:not([disabled])`,
          )
          await expect.element($selectedButton).toBeVisible()
          // Insert some text
          await insertPortableText(`${decorator.name} text 123`, $pte)
          // Turn off the decorator
          await toggleHotkey(decorator.hotkey, modifierKey)
          // Assertion: button was toggled
          const $unselectedButton = await findBySelector(
            $portableTextInput,
            `button[data-testid="action-button-${decorator.name}"]:not([data-selected]):not([disabled])`,
          )
          await expect.element($unselectedButton).toBeVisible()
          // Assertion: text has the correct decorator value
          const $decoratedText = await findBySelector($pte, `[data-mark="${decorator.name}"]`)
          await expect.element($decoratedText).toBeVisible()
          await expect.element($decoratedText).toMatchTextContent(`${decorator.name} text 123`)
        }
      }
      // The last keystrokes leave a validation run in flight; wait for it (and
      // the Normal style label) so the archive is not taken mid re-render.
      await settleChromaticEndState({
        styleSelectText: /^Normal$/,
        styleSelectRoot: '[data-testid="field-defaultDecorators"]',
      })
    })

    describe('Toolbar buttons', () => {
      it('Should display all default decorator buttons', async () => {
        const {getFocusedPortableTextInput, settleChromaticEndState} = testHelpers()
        void render(<DecoratorsHarness fields={['defaultDecorators']} />)
        const $portableTextInput = await getFocusedPortableTextInput('field-defaultDecorators')

        // Assertion: All buttons in the menu bar should be visible and have icon
        for (const decorator of DEFAULT_DECORATORS) {
          const $button = $portableTextInput.getByRole('button', {name: decorator.title})
          await expect.element($button).toBeVisible()
          const $icon = page.elementLocator(
            $button.element().querySelector(`svg[data-sanity-icon='${decorator.icon}']`)!,
          )
          await expect.element($icon).toBeVisible()
        }
        // Empty focused PTE can briefly report "No style" before Normal resolves.
        await settleChromaticEndState({
          styleSelectText: /^Normal$/,
          styleSelectRoot: '[data-testid="field-defaultDecorators"]',
        })
      })

      it('Should display custom decorator button and icon', async () => {
        const {getFocusedPortableTextInput, settleChromaticEndState} = testHelpers()
        void render(<DecoratorsHarness fields={['customDecorator']} />)
        const $portableTextInput = await getFocusedPortableTextInput('field-customDecorator')
        // Assertion: Button for highlight should exist
        const $highlightButton = $portableTextInput.getByRole('button', {name: 'Highlight'})
        await expect.element($highlightButton).toBeVisible()
        // Assertion: Icon for highlight should exist
        const $icon = page.elementLocator(
          $highlightButton.element().querySelector(`svg[data-sanity-icon='bulb-outline']`)!,
        )
        await expect.element($icon).toBeVisible()
        // Empty focused PTE can briefly report "No style" before the block style
        // resolves to Normal — wait so Chromatic does not archive either label.
        await settleChromaticEndState({
          styleSelectText: /^Normal$/,
          styleSelectRoot: '[data-testid="field-customDecorator"]',
        })
      })
    })

    it('Renders a custom decorator component with its BlockDecoratorProps (title, value) and mounts renderDefault', async () => {
      const {
        findBySelector,
        getFocusedPortableTextInput,
        getFocusedPortableTextEditor,
        insertPortableText,
        settleChromaticEndState,
      } = testHelpers()
      void render(<DecoratorsHarness fields={['customDecorator']} />)
      const $portableTextInput = await getFocusedPortableTextInput('field-customDecorator')
      const $pte = await getFocusedPortableTextEditor('field-customDecorator')

      await $portableTextInput.getByRole('button', {name: 'Highlight'}).click()
      await insertPortableText('highlighted text', $pte)

      const $customComponent = await findBySelector(
        $pte,
        '[data-testid="custom-highlight-decorator"]',
      )
      await expect.element($customComponent).toBeVisible()
      await expect.element($customComponent).toMatchTextContent('highlighted text')

      await expect.element($customComponent).toHaveAttribute('data-title', 'Highlight')
      await expect.element($customComponent).toHaveAttribute('data-value', 'highlight')

      // `data-mark` comes from Studio's own `DefaultComponent` in
      // `text/Decorator.tsx`; the editor's built-in default render for
      // registered decorators is identity and adds no markup
      const $defaultMarkup = page.elementLocator(
        $customComponent.element().querySelector('[data-mark="highlight"]')!,
      )
      await expect.element($defaultMarkup).toBeVisible()
      await expect.element($defaultMarkup).toMatchTextContent('highlighted text')
      // Selected Highlight toolbar pill background was a pairwise AA/hover flake.
      // Force Normal so the style select cannot archive as No style.
      await settleChromaticEndState({
        styleSelectText: /^Normal$/,
        styleSelectRoot: '[data-testid="field-customDecorator"]',
      })
    })

    it('Styles a code mark by the scheme a custom decorator renders it in', async () => {
      const {
        findBySelector,
        getFocusedPortableTextInput,
        getFocusedPortableTextEditor,
        insertPortableText,
        settleChromaticEndState,
      } = testHelpers()
      void render(<DecoratorsHarness fields={['darkCodeDecorator']} />)
      const $portableTextInput = await getFocusedPortableTextInput('field-darkCodeDecorator')
      const $pte = await getFocusedPortableTextEditor('field-darkCodeDecorator')

      await $portableTextInput.getByRole('button', {name: 'Code'}).click()
      await insertPortableText('code text', $pte)

      const $mark = await findBySelector(
        $pte,
        '[data-testid="dark-code-decorator"] [data-mark="code"]',
      )
      await expect.element($mark).toMatchTextContent('code text')
      // The studio renders in the light scheme; the mark sits inside the custom component's dark
      // Card, so it has to take the dark scheme's blend mode (`screen`, not `multiply`)
      await expect.poll(() => getComputedStyle($mark.element()).mixBlendMode).toBe('screen')
      await settleChromaticEndState({
        styleSelectText: /^Normal$/,
        styleSelectRoot: '[data-testid="field-darkCodeDecorator"]',
      })
    })

    it('Renders a custom decorator component that renders only its children', async () => {
      const {
        findBySelector,
        getFocusedPortableTextInput,
        getFocusedPortableTextEditor,
        insertPortableText,
        settleChromaticEndState,
      } = testHelpers()
      void render(<DecoratorsHarness fields={['customDecorator']} />)
      const $portableTextInput = await getFocusedPortableTextInput('field-customDecorator')
      const $pte = await getFocusedPortableTextEditor('field-customDecorator')

      await $portableTextInput.getByRole('button', {name: 'Spoiler'}).click()
      await insertPortableText('spoiler text', $pte)

      const $customComponent = await findBySelector(
        $pte,
        '[data-testid="custom-spoiler-decorator"]',
      )
      await expect.element($customComponent).toBeVisible()
      await expect.element($customComponent).toMatchTextContent('spoiler text')
      // Spoiler stays selected on the caret; clear hover so Chromatic does not
      // archive a mid-hover pill around the selected toolbar button.
      await settleChromaticEndState({
        styleSelectText: /^Normal$/,
        styleSelectRoot: '[data-testid="field-customDecorator"]',
      })
    })
  })
})
