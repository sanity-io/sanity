import {type FormNodeValidation} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {WithStudioProviders} from '../../lib/testProvider'
import {FieldDemo} from './fieldTestHarness'

const schemaTypes = [
  {
    name: 'review',
    title: 'Review',
    type: 'document',
    fields: [
      {
        name: 'rating',
        title: 'Rating',
        type: 'number',
        description: 'A whole number from 1 to 5.',
      },
      {
        name: 'price',
        title: 'Price',
        type: 'number',
        description: 'Retail price in USD.',
      },
    ],
  },
]

const OUT_OF_RANGE: FormNodeValidation[] = [
  {level: 'error', message: 'Rating must be between 1 and 5.', path: ['rating']},
]

const meta: Meta = {
  title: 'Forms & Input/NumberInput',
  parameters: {
    // No meta-level `component`: each story drives state through field fixture rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'A `type="number"` input will happily change its value when you scroll over it, a ' +
            'classic way to corrupt data without noticing, and NumberInput exists precisely to ' +
            'close that gap while picking the right mobile keyboard along the way.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/NumberInput/NumberInput.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | SERVICE. Wraps `@sanity/ui`’s `TextInput` (`type="number"`), composed with the real `FormField` chrome |',
          '| Audit | 🔴 needs-work (`error-messages`, `inline-validation-timing`, `required-optional-marking`, `schema-driven-forms`). Same form-legibility trio as StringInput, inherited through the shared `FormField` chrome: the error hides behind a hover tooltip, requiredness is unmarked, and validation defers to publish |',
          '| Patterns | `error-messages` · `inline-validation-timing` · `required-optional-marking` · `schema-driven-forms` |',
          '| Mechanism | derives mobile `inputMode` from the field’s `min` / `integer` / `precision` rules (numeric, decimal, or text), plus a wheel-event guard against scroll mutation |',
          '',
          'It looks like a plain text box, but it is quietly schema-aware. From the field’s own ' +
            '`min` / `integer` / `precision` rules it picks the right mobile keyboard: a number pad ' +
            'for integers, a decimal pad for prices, plain text when nothing constrains it, so an ' +
            'editor on a phone gets sensible keys. And it installs a wheel guard, so an accidental ' +
            'scroll over the field never silently nudges the value up or down.',
          '',
          'Under the hood it wraps `@sanity/ui`’s `TextInput` at `type="number"`, mounted for real ' +
            'inside the real `FormField` chrome via `fieldTestHarness`. It inherits the same ' +
            'form-legibility trio as every field; the Current/Recommended fixes for it are built ' +
            'once on **StringInput**.',
          '',
          '> **Why it matters:** a `type="number"` input will happily change its value when you ' +
            'scroll over it, a classic way to corrupt data without noticing. NumberInput installs a ' +
            'wheel guard so that cannot happen; if you ever rebuild this field, keep that guard.',
          '',
          'The page closes **in context**: the numeric fields at work, a review of *Anna Karenina* ' +
            'with its rating and price side by side in one live form.',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders({config: {schema: {name: 'storybook', types: schemaTypes}}})],
  tags: [
    'autodocs',
    'chapter:forms',
    'chapter:cms',
    'pattern:error-messages',
    'pattern:inline-validation-timing',
    'pattern:required-optional-marking',
    'pattern:schema-driven-forms',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** Empty numeric field. With no min/integer rule, inputMode falls back to `text`. */
export const Default: Story = {
  render: () => <FieldDemo documentType="review" fieldName="rating" kind="number" />,
}

/** A bound value, editable; scrolling over it will not mutate it (the wheel guard). */
export const WithValue: Story = {
  name: 'With value',
  render: () => <FieldDemo documentType="review" fieldName="rating" kind="number" value={4} />,
}

/** Read-only: disabled, muted transparent tone. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => (
    <FieldDemo documentType="review" fieldName="price" kind="number" value={49} readOnly />
  ),
}

/**
 * Validation error as the real form renders it: pink field tint plus a header error icon
 * whose message stays behind the hover tooltip (`error-messages`). See StringInput for
 * the Recommended inline-message fix.
 */
export const WithValidationError: Story = {
  name: 'With validation error',
  render: () => (
    <FieldDemo
      documentType="review"
      fieldName="rating"
      kind="number"
      value={9}
      validation={OUT_OF_RANGE}
    />
  ),
}

/**
 * **In context.** The numeric fields doing their real job: a review of *Anna Karenina*
 * mid-edit, its 1-5 rating above the retail price. Both are live, and both quietly carry
 * the wheel guard, so an accidental scroll over either one leaves the value untouched.
 */
export const InContext: Story = {
  name: 'In context',
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={3} shadow={1} style={{maxWidth: 480}}>
      <Stack gap={4}>
        <Text size={1} muted weight="medium">
          Review · Anna Karenina
        </Text>
        <FieldDemo documentType="review" fieldName="rating" kind="number" value={5} />
        <FieldDemo documentType="review" fieldName="price" kind="number" value={24} />
      </Stack>
    </Card>
  ),
}
