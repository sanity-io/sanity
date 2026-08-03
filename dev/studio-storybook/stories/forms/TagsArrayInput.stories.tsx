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
        name: 'tags',
        title: 'Tags',
        type: 'array',
        of: [{type: 'string'}],
        options: {layout: 'tags'},
        description: 'Free-form labels. Press Enter to add each one.',
      },
    ],
  },
]

const NO_TAGS: FormNodeValidation[] = [
  {level: 'error', message: 'Add at least one tag before publishing.', path: ['tags']},
]

const meta: Meta = {
  title: 'Forms & Input/TagsArrayInput',
  parameters: {
    // No meta-level `component`: each story drives state through field fixture rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'The one thing an editor needs to know, press Enter to add each tag, lives only in ' +
            'the field’s description prose, not on the control itself. Nothing in the chip box ' +
            'tells them how to add the first tag.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/TagsArrayInput.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | SERVICE. The tags field: an array-of-strings input rendered as removable chips. It wraps Studio’s own `TagInput` component (not a bare `@sanity/ui` primitive), maps the stored `string[]` to and from `TagInput`’s `{value}[]` shape, strips stega metadata from pasted text, emits `set` / `unset` patches, and wraps its content in a `ChangeIndicator`. Composed with the real `FormField` chrome |',
          '| Audit | 🔴 needs-work (`error-messages`, `input-hints`, `schema-driven-forms`). Like every field, validation surfaces only through the `FormField` header’s hover-only icon; the chip control itself gives no at-rest error message. The "press Enter to add" affordance lives in the description prose (`input-hints`), not the control |',
          '| Patterns | `error-messages` · `input-hints` · `schema-driven-forms` |',
          '',
          'The tags field: type a label, press Enter, and it becomes a removable chip; the whole ' +
            'set is stored as a plain array of strings.',
          '',
          'When you want a handful of free-form labels on a document, topics, keywords, ' +
            'categories, this renders an array of strings as friendly removable chips. Type, ' +
            'press Enter, and each entry becomes a chip you can pop off with a click. It even ' +
            'strips stega metadata out of pasted text, so copy-pasting from a Visual Editing ' +
            'session does not smuggle invisible markers into your tags.',
          '',
          'It wraps Studio’s own `TagInput` (not a bare `@sanity/ui` primitive), maps the stored ' +
            '`string[]` to and from `TagInput`’s `{value}[]` shape, emits `set` / `unset` patches, ' +
            'and wraps its content in a `ChangeIndicator` inside the real `FormField` chrome. ' +
            'Mounted for real via `fieldTestHarness`; the shared form-legibility fixes live on ' +
            '**StringInput**.',
          '',
          '> **Why it matters:** the one thing an editor needs to know, *press Enter to add each ' +
            'tag*, lives only in the field’s description prose, not on the control itself ' +
            '(`input-hints`). Nothing in the chip box tells them how to add the first tag.',
          '',
          'The page closes **in context**: the Tags field on the *Anna Karenina* book, three ' +
            'real chips you can pop off, beneath the document title.',
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
    'pattern:input-hints',
    'pattern:schema-driven-forms',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** Empty; add tags by typing and pressing Enter. */
export const Default: Story = {
  render: () => <FieldDemo documentType="article" fieldName="tags" kind="tags" />,
}

/** A bound value: three chips; remove one to emit a `set`/`unset` patch. */
export const WithValue: Story = {
  name: 'With value',
  render: () => (
    <FieldDemo
      documentType="article"
      fieldName="tags"
      kind="tags"
      value={['design', 'engineering', 'product']}
    />
  ),
}

/** Read-only: chips render without remove affordances. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => (
    <FieldDemo
      documentType="article"
      fieldName="tags"
      kind="tags"
      value={['design', 'engineering']}
      readOnly
    />
  ),
}

/**
 * Validation error as the real form renders it: the `FormField` header grows an error icon
 * whose message stays behind the hover (`error-messages`); the chip control shows nothing
 * at rest. See StringInput for the Recommended inline-message fix.
 */
export const WithValidationError: Story = {
  name: 'With validation error',
  render: () => (
    <FieldDemo documentType="article" fieldName="tags" kind="tags" validation={NO_TAGS} />
  ),
}

/**
 * **In context.** The tags field where it actually lives: the *Anna Karenina* document
 * open in a pane, its title in the header and the Tags field below, already carrying three
 * chips. Each chip is live, click one to pop it off, and typing a new label plus Enter
 * adds another. The everyday moment of labelling a document.
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
          fieldName="tags"
          kind="tags"
          value={['russian-literature', 'classics', 'tolstoy']}
        />
      </Stack>
    </Card>
  ),
}
