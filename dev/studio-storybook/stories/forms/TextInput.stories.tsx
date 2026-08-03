import {type FormNodeValidation} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {WithStudioProviders} from '../../lib/testProvider'
import {FieldDemo} from './fieldTestHarness'

const schemaTypes = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      {
        name: 'body',
        title: 'Body',
        type: 'text',
        rows: 6,
        description: 'The article copy. Plain multi-line text.',
      },
    ],
  },
]

const TOO_LONG: FormNodeValidation[] = [
  {level: 'error', message: 'Body must be 280 characters or fewer.', path: ['body']},
]

const meta: Meta = {
  title: 'Forms & Input/TextInput',
  parameters: {
    // No meta-level `component`: each story drives state through field fixture rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Everything that ails StringInput ails this field too: hidden error messages, ' +
            'unmarked requiredness, publish-only validation, because both ride the same ' +
            '`FormField` chrome. Fix the chrome once and every string-like field improves ' +
            'together.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/TextInput.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | SERVICE. The multi-line string field. It wraps `@sanity/ui`’s `TextArea`, adds vertical-only resize, applies the schema’s `rows` (default 10), the placeholder, and the `validationError` → `customValidity` binding, and is composed with the real `FormField` chrome |',
          '| Audit | 🔴 needs-work (`error-messages`, `inline-validation-timing`, `required-optional-marking`, `schema-driven-forms`). TextInput inherits the whole form-legibility trio through the shared `FormField` chrome: the error message hides behind the header’s hover tooltip while the field only tints, requiredness is never marked, and validation defers to publish. The Current/Recommended pairs are built once on **StringInput**; this field renders them identically |',
          '| Patterns | `error-messages` · `inline-validation-timing` · `required-optional-marking` · `schema-driven-forms` |',
          '',
          'The multi-line text field: a resizable textarea for longer plain-text copy like a ' +
            'summary or a body blurb.',
          '',
          'When one line is not enough but you do not need rich formatting, this is the field: a ' +
            'plain multi-line textarea for summaries, descriptions, longer notes. It honours the ' +
            'schema’s `rows` for its starting height (default 10) and resizes vertically as the ' +
            'copy grows, never sideways, so it cannot break your form layout.',
          '',
          'It wraps `@sanity/ui`’s `TextArea`, applies the placeholder and the `validationError` ' +
            '→ `customValidity` binding, and composes with the real `FormField` chrome. Mounted ' +
            'for real via `fieldTestHarness`. The validation-error story shows the shipped ' +
            'composition unmodified; hover the header icon to reveal the message that should be ' +
            'inline.',
          '',
          '> **Why it matters:** everything that ails **StringInput** ails this field too: hidden ' +
            'error messages, unmarked requiredness, publish-only validation, because both ride the ' +
            'same `FormField` chrome. Fix the chrome once and every string-like field improves ' +
            'together.',
          '',
          'The page closes **in context**: the Body field in a real document pane, writing the ' +
            'copy of the *Anna Karenina* book, beneath its title header.',
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

/** Empty multi-line field, six rows from the schema. */
export const Default: Story = {
  render: () => <FieldDemo documentType="article" fieldName="body" kind="text" />,
}

/** A bound value, editable; the textarea resizes vertically. */
export const WithValue: Story = {
  name: 'With value',
  render: () => (
    <FieldDemo
      documentType="article"
      fieldName="body"
      kind="text"
      value={'Winter came early this year.\nThe issue almost wrote itself.'}
    />
  ),
}

/** Read-only: disabled, muted transparent tone. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => (
    <FieldDemo
      documentType="article"
      fieldName="body"
      kind="text"
      value="Locked copy, awaiting legal sign-off."
      readOnly
    />
  ),
}

/**
 * Validation error as the real form renders it: pink tint on the field, an error icon in
 * the header, and the message itself hidden behind the icon’s hover tooltip
 * (`error-messages`). See StringInput for the Recommended inline-message fix.
 */
export const WithValidationError: Story = {
  name: 'With validation error',
  render: () => (
    <FieldDemo
      documentType="article"
      fieldName="body"
      kind="text"
      value={'This body copy runs well past the limit the schema allows…'}
      validation={TOO_LONG}
    />
  ),
}

/**
 * **In context.** The multi-line field where it actually lives: the *Anna Karenina*
 * document open in a pane, its title in the header and the Body textarea below, mid-edit.
 * The field is live; keep typing and it grows downward, never sideways. This is the
 * everyday moment of writing a document’s longer copy.
 */
export const InContext: Story = {
  name: 'In context',
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={3} shadow={1} style={{maxWidth: 480}}>
      <Stack gap={4}>
        <Stack gap={2}>
          <Text size={1} muted weight="medium">
            Book · Editing
          </Text>
          <Text size={3} weight="semibold">
            Anna Karenina
          </Text>
        </Stack>
        <FieldDemo
          documentType="article"
          fieldName="body"
          kind="text"
          value={
            'Happy families are all alike; every unhappy family is unhappy in its own way.\nEverything was in confusion in the Oblonskys’ house.'
          }
        />
      </Stack>
    </Card>
  ),
}
