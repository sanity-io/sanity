import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {type FormNodeValidation} from '@sanity/types'
import {Button as UIButton, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useCallback, useState} from 'react'

import {WithStudioProviders} from '../../lib/testProvider'
import {FieldDemo} from './fieldTestHarness'

const schemaTypes = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string', description: 'The article headline.'},
      {
        name: 'slug',
        title: 'Slug',
        type: 'string',
        description: 'Lowercase, hyphen-separated. Used in the URL.',
      },
      {
        name: 'authorName',
        title: 'Author name',
        type: 'string',
        // The audit finding lives here: requiredness is communicated only in the
        // description prose, never as a marker on the label.
        description: 'Required. Appears on the byline.',
      },
    ],
  },
]

/** The concrete slug error the audit screenshot captured, reused across the error-message stories. */
const SLUG_ERROR: FormNodeValidation[] = [
  {level: 'error', message: 'Slugs must be lowercase.', path: ['slug']},
]

/** A visible required marker, the missing affordance the Recommended stories add to the real label. */
function RequiredLabel(props: {children: ReactNode}) {
  return (
    <>
      {props.children}
      <span aria-hidden="true" style={{color: 'var(--card-badge-critical-fg-color)'}}>
        {' '}
        *
      </span>
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
        }}
      >
        {' '}
        (required)
      </span>
    </>
  )
}

/** A persistent, at-rest inline error message with a concrete fix, the Recommended error UI. */
function InlineErrorMessage(props: {children: ReactNode}) {
  return (
    <Card tone="critical" padding={2} radius={2} marginTop={2}>
      <Flex gap={2} align="center">
        <Text size={1}>
          <ErrorOutlineIcon />
        </Text>
        <Text size={1}>{props.children}</Text>
      </Flex>
    </Card>
  )
}

const meta: Meta = {
  title: 'Forms & Input/StringInput',
  parameters: {
    // No meta-level `component`: each story drives state through field fixture rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'This is the canonical home of the form-legibility trio: requiredness unmarked, ' +
            'validation deferred to publish, error messages hidden behind hover. Every other ' +
            'string-like field inherits the same defects through the same chrome, and this is ' +
            'where the Current/Recommended pairs for all three are built once.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/StringInput/StringInput.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | SERVICE. The schema-driven string field. It binds `@sanity/ui`’s `TextInput` to the form layer (patch emission, `validationError` → `customValidity`, i18n) and is composed with the real `FormField` chrome (label, description, validation marker). The primitive is a text box; the wrapper is what makes it a *field* |',
          '| Audit | 🔴 needs-work (`required-optional-marking`, `inline-validation-timing`, `error-messages`, `schema-driven-forms`). Requiredness is never marked on the label (it lives only in grey description prose), validation fires only on a publish attempt rather than on blur, and an invalid field shows just a red icon + pink tint while the actual message hides behind a hover tooltip |',
          '| Patterns | `required-optional-marking` · `inline-validation-timing` · `error-messages` · `schema-driven-forms` |',
          '',
          'The plain single-line text field, the everyday input behind titles, names and short ' +
            'labels, wrapped in Studio’s label, description and validation chrome.',
          '',
          'This is the workhorse, the field most documents are mostly made of. On its own a text ' +
            'box is trivial; what makes it a *field* is everything wrapped around it: the label ' +
            'and description from your schema, patch emission back to the document, i18n, and ' +
            'the validation marker. StringInput binds `@sanity/ui`’s `TextInput` to all of that. ' +
            'Understand this page and you understand the shared chrome every other primitive ' +
            'input rides on.',
          '',
          'These stories mount the **real** `StringInput` inside the **real** `FormField` chrome ' +
            'via `fieldTestHarness`, so the label/description/validation markers are exactly what ' +
            'a document form renders, not a mock. `FormField` computes nothing about ' +
            'requiredness (there is no marker code path), and hands the `validation` array to ' +
            '`FormFieldHeaderText`, which renders it as a hover-only `FormFieldValidationStatus` ' +
            'icon. Every finding below is reproduced by the shipped components, not simulated.',
          '',
          'StringInput is the canonical home of the **form-legibility trio**. The ' +
            'Current/Recommended pairs for `required-optional-marking`, ' +
            '`inline-validation-timing`, and `error-messages` are built here once; the other ' +
            'primitive inputs (TextInput, NumberInput, Email/URL/Telephone) inherit the same ' +
            'defects through the same chrome and reference these stories.',
          '',
          '> **Why it matters:** this is the canonical home of the **form-legibility trio**: ' +
            'requiredness unmarked, validation deferred to publish, error messages hidden behind ' +
            'hover. The Current/Recommended pairs are built here once; every other string-like ' +
            'field inherits the same defects and points back to this page.',
          '',
          'The page closes **in context**: the everyday text fields at work, the *Anna Karenina* ' +
            'book mid-edit, its title, slug and author byline stacked as one live document form.',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders({config: {schema: {name: 'storybook', types: schemaTypes}}})],
  tags: [
    'autodocs',
    'chapter:forms',
    'chapter:cms',
    'pattern:required-optional-marking',
    'pattern:inline-validation-timing',
    'pattern:error-messages',
    'pattern:schema-driven-forms',
    'pattern:input-hints',
    'pattern:accessible-labeling',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** No value: the empty field with its label and description, as the form first renders it. */
export const Default: Story = {
  render: () => <FieldDemo documentType="article" fieldName="title" kind="string" />,
}

/** A bound value; the field is editable; type to change it. */
export const WithValue: Story = {
  name: 'With value',
  render: () => (
    <FieldDemo documentType="article" fieldName="title" kind="string" value="The Winter Issue" />
  ),
}

/** Read-only: the field is disabled and takes the muted transparent tone. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => (
    <FieldDemo
      documentType="article"
      fieldName="title"
      kind="string"
      value="The Winter Issue"
      readOnly
    />
  ),
}

/**
 * Validation error **as the real form renders it**: the field takes a critical (pink)
 * tint from `customValidity`, and the header grows a small error icon, but the message
 * itself is behind that icon’s hover tooltip. This is the shipped composition, unmodified.
 */
export const WithValidationError: Story = {
  name: 'With validation error',
  render: () => (
    <FieldDemo
      documentType="article"
      fieldName="slug"
      kind="string"
      value="MY-SLUG"
      validation={SLUG_ERROR}
    />
  ),
}

/**
 * **Current (audit finding).** `required-optional-marking`: a required field whose label
 * carries no marker at all. The only signal that it is required is the grey description
 * prose (“Required. Appears on the byline.”), easy to miss, and invisible once the
 * description is skimmed. This is the shipped `FormField`, which has no required-marker code path.
 */
export const CurrentRequiredMarking: Story = {
  name: 'Required marking, Current (no marker)',
  tags: ['audit:needs-work'],
  render: () => <FieldDemo documentType="article" fieldName="authorName" kind="string" />,
}

/**
 * **Recommended.** A visible required marker sits on the label itself (`*`, with an
 * off-screen “(required)” for assistive tech), so requiredness is legible before the
 * editor reads any prose. The real fix would also set `aria-required` on the input.
 */
export const RecommendedRequiredMarking: Story = {
  name: 'Required marking, Recommended (marker on label)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => (
    <FieldDemo
      documentType="article"
      fieldName="authorName"
      kind="string"
      title={<RequiredLabel>Author name</RequiredLabel>}
    />
  ),
}

/**
 * **Current (audit finding).** `inline-validation-timing`: type an invalid slug
 * (e.g. `UPPERCASE`); nothing happens. The error only appears when you press
 * **Publish**, long after you have moved on. Validation is deferred to the publish
 * attempt, not surfaced as you leave the field.
 */
export const CurrentValidationTiming: Story = {
  name: 'Validation timing, Current (only on publish)',
  tags: ['audit:needs-work'],
  render: () => {
    function Demo() {
      const [value, setValue] = useState<unknown>('')
      const [validation, setValidation] = useState<FormNodeValidation[]>([])

      const handlePublish = useCallback(() => {
        const invalid = typeof value === 'string' && value !== value.toLowerCase()
        setValidation(invalid ? SLUG_ERROR : [])
      }, [value])

      return (
        <Stack gap={3} style={{maxWidth: 420}}>
          <FieldDemo
            documentType="article"
            fieldName="slug"
            kind="string"
            value={value}
            onValueChange={(next) => {
              setValue(next)
              // Typing does NOT re-validate: the defect. The stale error only clears on the next publish.
            }}
            validation={validation}
          />
          <Flex>
            <UIButton text="Publish" tone="primary" onClick={handlePublish} />
          </Flex>
          <Text size={1} muted>
            Type <code>UPPERCASE</code>, then press Publish. The error waited until now.
          </Text>
        </Stack>
      )
    }
    return <Demo />
  },
}

/**
 * **Recommended.** `inline-validation-timing`: validation runs on blur. Type an invalid
 * slug and tab away (or click out); the error appears immediately, at the moment the
 * editor finishes the field, with a persistent inline message rather than a hover tooltip.
 */
export const RecommendedValidationTiming: Story = {
  name: 'Validation timing, Recommended (on blur)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => {
    function Demo() {
      const [value, setValue] = useState<unknown>('')
      const [validation, setValidation] = useState<FormNodeValidation[]>([])

      const validateOnBlur = useCallback(() => {
        const invalid = typeof value === 'string' && value !== value.toLowerCase()
        setValidation(invalid ? SLUG_ERROR : [])
      }, [value])

      const invalid = validation.length > 0

      return (
        <FieldDemo
          documentType="article"
          fieldName="slug"
          kind="string"
          value={value}
          onValueChange={(next) => {
            setValue(next)
            if (validation.length > 0) setValidation([]) // clear as they correct it
          }}
          onInputBlur={validateOnBlur}
          validation={validation}
          footer={
            invalid ? (
              <InlineErrorMessage>Slugs must be lowercase, try “my-slug”.</InlineErrorMessage>
            ) : undefined
          }
        />
      )
    }
    return <Demo />
  },
}

/**
 * **Current (audit finding).** `error-messages`: the shipped chrome signals an invalid
 * field with a red icon and a pink field tint only; the message (“Slugs must be
 * lowercase.”) is hidden until you hover the icon. The information needed to fix the
 * error is not visible at rest.
 */
export const CurrentErrorMessages: Story = {
  name: 'Error messages, Current (behind hover)',
  tags: ['audit:needs-work'],
  render: () => (
    <FieldDemo
      documentType="article"
      fieldName="slug"
      kind="string"
      value="MY-SLUG"
      validation={SLUG_ERROR}
    />
  ),
}

/**
 * **Recommended.** The message is shown inline, at rest, in a critical tone with a
 * concrete fix suggestion; the hover tooltip is demoted to an optional supplement.
 * Nothing the editor must act on is hidden.
 */
export const RecommendedErrorMessages: Story = {
  name: 'Error messages, Recommended (persistent inline)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => (
    <FieldDemo
      documentType="article"
      fieldName="slug"
      kind="string"
      value="MY-SLUG"
      validation={SLUG_ERROR}
      footer={<InlineErrorMessage>Slugs must be lowercase, try “my-slug”.</InlineErrorMessage>}
    />
  ),
}

/**
 * **In context.** The workhorse doing its real job. Not one field in isolation but the
 * *Anna Karenina* book mid-edit: three `StringInput`s stacked as a document form, the
 * title, the slug, and the author byline. Every one is live; type in any of them and it
 * emits the same patch a real document would. This is what “the field most documents are
 * mostly made of” looks like in company.
 */
export const InContext: Story = {
  name: 'In context',
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={3} shadow={1} style={{maxWidth: 480}}>
      <Stack gap={4}>
        <Text size={1} muted weight="medium">
          Book · Editing
        </Text>
        <FieldDemo documentType="article" fieldName="title" kind="string" value="Anna Karenina" />
        <FieldDemo documentType="article" fieldName="slug" kind="string" value="anna-karenina" />
        <FieldDemo
          documentType="article"
          fieldName="authorName"
          kind="string"
          value="Leo Tolstoy"
        />
      </Stack>
    </Card>
  ),
}
