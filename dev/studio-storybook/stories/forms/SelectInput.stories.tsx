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
        name: 'status',
        title: 'Status',
        type: 'string',
        description: 'Editorial workflow state.',
        options: {
          list: [
            {title: 'Draft', value: 'draft'},
            {title: 'In review', value: 'review'},
            {title: 'Published', value: 'published'},
          ],
        },
      },
      {
        name: 'visibility',
        title: 'Visibility',
        type: 'string',
        description: 'Who can see this once published.',
        options: {
          layout: 'radio',
          list: [
            {title: 'Public', value: 'public'},
            {title: 'Members only', value: 'members'},
            {title: 'Private', value: 'private'},
          ],
        },
      },
    ],
  },
]

const NO_SELECTION: FormNodeValidation[] = [
  {level: 'error', message: 'Choose a status before publishing.', path: ['status']},
]

const meta: Meta = {
  title: 'Forms & Input/SelectInput',
  parameters: {
    // No meta-level `component`: each story drives state through field fixture rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Enumerated choice is where Studio is strong, and the weak spot is entirely error ' +
            'legibility: an invalid select only tints critical and shows a hover-only icon, so ' +
            'the actual message stays hidden until an editor thinks to hover it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/SelectInput.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | SERVICE. The enumerated-choice field. It wraps `@sanity/ui`’s `Select` (dropdown) or a `Radio` group (`options.layout: "radio"`), maps the schema’s `options.list` of titled values to option elements, prepends an empty item, tones the control critical on error, emits `set` / `unset` patches, and, in the radio layout, adds a clear button. Wraps its content in a `ChangeIndicator`. Composed with the real `FormField` chrome |',
          '| Audit | 🔴 needs-work (`error-messages`, `schema-driven-forms`). An invalid select only tints critical and shows the header’s hover-only validation icon; the message stays behind the hover. Its enumerated-choice model is otherwise a solid `schema-driven-forms` example |',
          '| Patterns | `error-messages` · `schema-driven-forms` |',
          '',
          'The pick-one field, a dropdown or a radio group, for choosing a single value from a ' +
            'fixed list defined in the schema, like a document’s status.',
          '',
          'When a field should hold exactly one of a known set of values, draft/review/published, ' +
            'a visibility level, a category, this is the field. Declare the choices as ' +
            '`options.list` in your schema and it renders them as a dropdown, or as a radio group ' +
            'if you set `options.layout: "radio"`. It is a clean example of schema-driven forms: ' +
            'the model declares the choices, the input renders and validates them, and picking one ' +
            'emits the same `set` patch the real document form applies.',
          '',
          'It wraps `@sanity/ui`’s `Select` (or a `Radio` group), prepends an empty item, tones the ' +
            'control critical on error, and, in radio layout, adds a clear button, all inside a ' +
            '`ChangeIndicator` and the real `FormField` chrome. Mounted for real via ' +
            '`fieldTestHarness`; the shared form-legibility fixes live on **StringInput**.',
          '',
          '> **Why it matters:** enumerated choice is where Studio is strong; the weak spot is ' +
            'error *legibility*: an invalid select only tints critical and shows a hover-only ' +
            'icon, so the actual message stays hidden until you hover. The inline fix is the one ' +
            'shown on **StringInput**.',
          '',
          'The page closes **in context**: the workflow controls of the *Anna Karenina* article, ' +
            'its editorial status dropdown above the visibility radio group, both live.',
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
    'pattern:schema-driven-forms',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** Dropdown, no selection: the empty item is selected. */
export const Default: Story = {
  render: () => <FieldDemo documentType="article" fieldName="status" kind="select" />,
}

/** Dropdown with a value; pick another option to emit a `set` patch. */
export const WithValue: Story = {
  name: 'With value',
  render: () => (
    <FieldDemo documentType="article" fieldName="status" kind="select" value="published" />
  ),
}

/** Radio layout (`options.layout: 'radio'`) with a clear button once a value is set. */
export const RadioLayout: Story = {
  name: 'Radio layout',
  render: () => (
    <FieldDemo documentType="article" fieldName="visibility" kind="select" value="members" />
  ),
}

/** Read-only: disabled dropdown, no interaction. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => (
    <FieldDemo documentType="article" fieldName="status" kind="select" value="review" readOnly />
  ),
}

/**
 * Validation error as the real form renders it: the control tints critical and the header
 * grows an error icon whose message stays behind the hover (`error-messages`). See
 * StringInput for the Recommended inline-message fix.
 */
export const WithValidationError: Story = {
  name: 'With validation error',
  render: () => (
    <FieldDemo documentType="article" fieldName="status" kind="select" validation={NO_SELECTION} />
  ),
}

/**
 * **In context.** The pick-one fields doing their real job: the workflow corner of the
 * *Anna Karenina* article, mid-edit. The status dropdown reads *In review*; below it the
 * visibility radio group is set to *Members only*, its clear button live. Both are the two
 * shapes SelectInput ships, dropdown and radio, sitting together in one document form.
 */
export const InContext: Story = {
  name: 'In context',
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={3} shadow={1} style={{maxWidth: 480}}>
      <Stack gap={4}>
        <Text size={1} muted weight="medium">
          Anna Karenina · Workflow
        </Text>
        <FieldDemo documentType="article" fieldName="status" kind="select" value="review" />
        <FieldDemo documentType="article" fieldName="visibility" kind="select" value="members" />
      </Stack>
    </Card>
  ),
}
