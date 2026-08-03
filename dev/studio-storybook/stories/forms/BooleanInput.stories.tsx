import {type FormNodeValidation} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {WithStudioProviders} from '../../lib/testProvider'
import {FieldDemo} from './fieldTestHarness'

const schemaTypes = [
  {
    name: 'settings',
    title: 'Settings',
    type: 'document',
    fields: [
      {
        name: 'featured',
        title: 'Featured on the homepage',
        type: 'boolean',
        description: 'Pins this document to the top of the homepage feed.',
        options: {layout: 'switch'},
      },
      {
        name: 'acceptedTerms',
        title: 'Accepted terms',
        type: 'boolean',
        description: 'Editor confirmed the publishing agreement.',
        options: {layout: 'checkbox'},
      },
    ],
  },
]

const REQUIRED_UNCHECKED: FormNodeValidation[] = [
  {
    level: 'error',
    message: 'You must accept the terms before publishing.',
    path: ['acceptedTerms'],
  },
]

const meta: Meta = {
  title: 'Forms & Input/BooleanInput',
  parameters: {
    docs: {
      description: {
        component: [
          'BooleanInput draws its own field header instead of being wrapped in the shared one, ' +
            'so every story on this page has to tell its harness not to double-wrap it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/BooleanInput.tsx`, Studio-only, no DS equivalent |',
          '| Tier | SERVICE. The boolean field, and the one primitive input that builds its own `FormField` chrome rather than being wrapped in it |',
          "| Audit | 🔴 needs-work (`error-messages`, `similarity`, `schema-driven-forms`). On error the field only shifts to a critical card tone and shows the header's hover-only validation icon; the message stays behind the hover |",
          '| Atom | the control itself is the `@sanity/ui` `Switch` (or `Checkbox`); see [UI v3 Primitives → Form](?path=/docs/ui-v3-primitives-form--docs) for the raw atom, its state matrix, and the indeterminate (unset) value read on its own |',
          '| Patterns | `error-messages` · `similarity` · `schema-driven-forms` |',
          '',
          'The yes/no field, a switch or a checkbox, for the true-or-false facts on a document, ' +
            'like whether a post is featured or the terms were accepted. Reach for it whenever a ' +
            'field is genuinely binary. Pick `options.layout: "switch"` for a toggle or ' +
            '`"checkbox"` for a tick, and Studio handles the parts you would rather not: a value ' +
            'that has never been set reads as *indeterminate*, neither on nor off, instead of a ' +
            'misleading `false`, and a read-only control tells the editor why it is locked rather ' +
            'than just greying out (the real `inputs.boolean.disabled` i18n string).',
          '',
          "It wraps `@sanity/ui`'s `Switch` or `Checkbox` (chosen by `options.layout`), handles " +
            'the indeterminate state for a not-yet-set value, tones the card critical on error, ' +
            'and, when read-only, wraps the control in a `Tooltip` explaining why it is disabled.',
          '',
          'One quirk sets it apart from every other primitive input: it builds its own `FormField` ' +
            'chrome instead of being wrapped in it. That is why these stories turn the shared ' +
            'chrome off explicitly, the harness must not double-wrap it. Under the hood it is ' +
            "`@sanity/ui`'s `Switch` (or `Checkbox`), mounted for real via `fieldTestHarness`; the " +
            'shared form-legibility fixes live on StringInput.',
          '',
          '> **Why it matters:** BooleanInput is the only primitive input that renders its own ' +
            'field header. Wrap it in the standard field chrome and it would show two labels ' +
            'stacked, which is exactly why every story on this page turns the shared header off.',
          '',
          'The page closes in context: the pre-publish settings for the Anna Karenina book, the ' +
            'homepage-feature switch above the terms checkbox, both live, in one panel.',
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
    'pattern:similarity',
    'pattern:schema-driven-forms',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** Switch layout, unset (indeterminate); the field renders its own label + description header. */
export const Default: Story = {
  render: () => (
    <FieldDemo documentType="settings" fieldName="featured" kind="boolean" chrome={false} />
  ),
}

/** Switch layout, checked; toggle it, the control drives its own value. */
export const WithValue: Story = {
  name: 'With value (on)',
  render: () => (
    <FieldDemo documentType="settings" fieldName="featured" kind="boolean" value chrome={false} />
  ),
}

/** Checkbox layout, chosen by `options.layout: 'checkbox'`. */
export const CheckboxLayout: Story = {
  name: 'Checkbox layout',
  render: () => (
    <FieldDemo
      documentType="settings"
      fieldName="acceptedTerms"
      kind="boolean"
      value
      chrome={false}
    />
  ),
}

/** Read-only: the control is disabled and wrapped in a tooltip explaining why. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => (
    <FieldDemo
      documentType="settings"
      fieldName="featured"
      kind="boolean"
      value
      readOnly
      chrome={false}
    />
  ),
}

/**
 * Validation error as the real form renders it: the card takes a critical tone and the
 * header grows an error icon, but the message (“You must accept the terms…”) stays behind
 * the hover (`error-messages`). See StringInput for the Recommended inline-message fix.
 */
export const WithValidationError: Story = {
  name: 'With validation error',
  render: () => (
    <FieldDemo
      documentType="settings"
      fieldName="acceptedTerms"
      kind="boolean"
      validation={REQUIRED_UNCHECKED}
      chrome={false}
    />
  ),
}

/**
 * **In context.** The yes/no fields doing their real job: the pre-publish settings for the
 * *Anna Karenina* book. The homepage-feature switch is on; the terms checkbox sits *unset*
 * (indeterminate, not a misleading “no”), the exact state an editor meets just before
 * hitting Publish. Toggle either one; each drives its own value.
 */
export const InContext: Story = {
  name: 'In context',
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={3} shadow={1} style={{maxWidth: 480}}>
      <Stack gap={4}>
        <Text size={1} muted weight="medium">
          Anna Karenina · Publish settings
        </Text>
        <FieldDemo
          documentType="settings"
          fieldName="featured"
          kind="boolean"
          value
          chrome={false}
        />
        <FieldDemo
          documentType="settings"
          fieldName="acceptedTerms"
          kind="boolean"
          chrome={false}
        />
      </Stack>
    </Card>
  ),
}
