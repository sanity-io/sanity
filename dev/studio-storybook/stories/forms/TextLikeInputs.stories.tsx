import {type FormNodeValidation} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {WithStudioProviders} from '../../lib/testProvider'
import {FieldDemo} from './fieldTestHarness'

/**
 * Email, URL and Telephone are three thin format wrappers over the same `@sanity/ui`
 * `TextInput`, so they share one story page (org contract §1 allows grouping tiny
 * related inputs). Fields are typed `string` with placeholders; each story renders the
 * specific input, which sets the HTML `type` / `inputMode` for keyboard and validation hints.
 */
const schemaTypes = [
  {
    name: 'contact',
    title: 'Contact',
    type: 'document',
    fields: [
      {
        name: 'email',
        title: 'Email',
        type: 'string',
        description: 'Primary contact address.',
        placeholder: 'editor@example.com',
      },
      {
        name: 'website',
        title: 'Website',
        type: 'string',
        description: 'Full URL, including the scheme.',
        placeholder: 'https://example.com',
      },
      {
        name: 'phone',
        title: 'Phone',
        type: 'string',
        description: 'Include the country code.',
        placeholder: '+1 555 0100',
      },
    ],
  },
]

const BAD_EMAIL: FormNodeValidation[] = [
  {level: 'error', message: 'Enter a valid email address.', path: ['email']},
]

const meta: Meta = {
  title: 'Forms & Input/Email, URL & Telephone',
  parameters: {
    // No meta-level `component`: each story drives state through field fixture rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'These fields hint at a format but do not enforce or repair one: they will not trim a ' +
            'stray space, add a missing `https://`, or normalize a phone number. The keyboard is ' +
            'smarter than the validation.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/`, Studio-only (no design-system equivalent) |',
          '| Tier | SERVICE. Three format-specialized string fields. Each wraps `@sanity/ui`’s `TextInput` and sets the HTML `type` and `inputMode` so the browser offers the right on-screen keyboard and native hints: `EmailInput` → `type="email"`, `TelephoneInput` → `type="tel"`, `UrlInput` → `type="url"` (or `text` when the field’s `uri` rule allows relative URLs). All bind `validationError` → `customValidity` and compose with the real `FormField` chrome |',
          '| Audit | 🔴 needs-work (`error-messages`, `forgiving-format`, `input-hints`, `schema-driven-forms`). The inputs surface the browser keyboard hint but do not reformat or normalize input (`forgiving-format`), and an invalid value only tints the field while the message hides behind the header hover (`error-messages`). The placeholder is the only in-field hint (`input-hints`) |',
          '| Patterns | `error-messages` · `forgiving-format` · `input-hints` · `schema-driven-forms` |',
          '',
          'Three format-specialized text fields, Email, URL and Telephone, that look like a plain ' +
            'string box but tell the browser what kind of value to expect.',
          '',
          'These three are the same text field wearing different hats. Each sets the HTML `type` ' +
            'and `inputMode` so a phone brings up the right on-screen keyboard, the @ key for ' +
            'email, a dial pad for telephone, the URL row for a web address, and the browser ' +
            'offers its native format hints. Small touches, but they are the difference between a ' +
            'form that fights a mobile editor and one that gets out of the way.',
          '',
          'Under the hood: `EmailInput` → `type="email"`, `TelephoneInput` → `type="tel"`, ' +
            '`UrlInput` → `type="url"` (or `text` when the field’s `uri` rule allows relative ' +
            'URLs). All bind `validationError` → `customValidity` and compose with the real ' +
            '`FormField` chrome. Mounted for real via `fieldTestHarness`; the shared ' +
            'form-legibility fixes live on **StringInput**.',
          '',
          '> **Why it matters:** these fields hint at a format but do not enforce or repair one: ' +
            'they will not trim a stray space, add a missing `https://`, or normalize a phone ' +
            'number (`forgiving-format`). The keyboard is smarter than the validation; plan to ' +
            'normalize yourself if the shape matters downstream.',
          '',
          'The page closes **in context**: an author contact record, the email, website and ' +
            'telephone fields filled in together in one live form.',
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
    'pattern:forgiving-format',
    'pattern:input-hints',
    'pattern:schema-driven-forms',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** Email: empty, showing the placeholder hint; `type="email"` sets the email keyboard. */
export const EmailDefault: Story = {
  name: 'Email: default',
  render: () => <FieldDemo documentType="contact" fieldName="email" kind="email" />,
}

/** Email: a bound value. */
export const EmailWithValue: Story = {
  name: 'Email: with value',
  render: () => (
    <FieldDemo documentType="contact" fieldName="email" kind="email" value="editor@sanity.io" />
  ),
}

/**
 * Email: validation error as the real form renders it: pink tint plus a header error icon
 * whose message stays behind the hover (`error-messages`). See StringInput for the
 * Recommended inline-message fix.
 */
export const EmailInvalid: Story = {
  name: 'Email: validation error',
  render: () => (
    <FieldDemo
      documentType="contact"
      fieldName="email"
      kind="email"
      value="editor@@sanity"
      validation={BAD_EMAIL}
    />
  ),
}

/** Email, read-only: disabled, muted transparent tone. */
export const EmailReadOnly: Story = {
  name: 'Email: read only',
  render: () => (
    <FieldDemo
      documentType="contact"
      fieldName="email"
      kind="email"
      value="editor@sanity.io"
      readOnly
    />
  ),
}

/** URL: empty, showing the scheme-inclusive placeholder; `type="url"`. */
export const UrlDefault: Story = {
  name: 'URL: default',
  render: () => <FieldDemo documentType="contact" fieldName="website" kind="url" />,
}

/** URL: a bound value. */
export const UrlWithValue: Story = {
  name: 'URL: with value',
  render: () => (
    <FieldDemo documentType="contact" fieldName="website" kind="url" value="https://sanity.io" />
  ),
}

/** Telephone: empty, showing the country-code placeholder; `type="tel"` sets the dial pad. */
export const TelephoneDefault: Story = {
  name: 'Telephone: default',
  render: () => <FieldDemo documentType="contact" fieldName="phone" kind="tel" />,
}

/** Telephone: a bound value. */
export const TelephoneWithValue: Story = {
  name: 'Telephone: with value',
  render: () => (
    <FieldDemo documentType="contact" fieldName="phone" kind="tel" value="+1 555 0100" />
  ),
}

/**
 * **In context.** All three format-specialized fields together, doing their real job: an
 * author contact record mid-edit, with the email, website and telephone filled in. Each is
 * live and each cues its own on-screen keyboard, the email keys, the URL row, the dial pad, so
 * the set reads as one coherent contact form rather than three lookalike boxes.
 */
export const InContext: Story = {
  name: 'In context',
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={3} shadow={1} style={{maxWidth: 480}}>
      <Stack gap={4}>
        <Text size={1} muted weight="medium">
          Author · Contact details
        </Text>
        <FieldDemo documentType="contact" fieldName="email" kind="email" value="editor@sanity.io" />
        <FieldDemo
          documentType="contact"
          fieldName="website"
          kind="url"
          value="https://sanity.io"
        />
        <FieldDemo documentType="contact" fieldName="phone" kind="tel" value="+1 555 0100" />
      </Stack>
    </Card>
  ),
}
