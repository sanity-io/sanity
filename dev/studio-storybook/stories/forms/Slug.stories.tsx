import {
  type ObjectSchemaType,
  type Path,
  type SanityDocument,
  type SlugSchemaType,
  type SlugValue,
  type ValidationMarker,
} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useId, useRef, useState} from 'react'

import {GetFormValueProvider} from '../../../../packages/sanity/src/core/form/contexts/GetFormValue'
// Real components from real paths (org contract §8): the input under audit and the
// patch/type layer it emits.
import {SlugInput} from '../../../../packages/sanity/src/core/form/inputs/Slug/SlugInput'
import {type PatchEvent} from '../../../../packages/sanity/src/core/form/patch/PatchEvent'
import {type FormPatch} from '../../../../packages/sanity/src/core/form/patch/types'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * A `post` document with a `title` (the slug's source field) plus a `slug`. Two slug
 * fields: `slug` uses `source: 'title'` (so the Generate button appears), `slugNoSource`
 * omits it (Generate is hidden). `slugify` lowercases + hyphenates, so the audit's
 * "Dude, UPPERCASE!" copy is a validation-rule finding, not a normalisation one.
 */
const schemaTypes = [
  {
    name: 'post',
    title: 'Post',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}},
      {name: 'slugNoSource', title: 'Slug (no source)', type: 'slug'},
    ],
  },
]

/** The host document the generate flow reads its source `title` from. */
const hostDocument: SanityDocument = {
  _id: 'drafts.post-1',
  _type: 'post',
  _rev: 'rev-post-1',
  _createdAt: '2026-03-01T09:00:00Z',
  _updatedAt: '2026-03-01T09:00:00Z',
  title: 'My First Post!',
}

interface DemoProps {
  fieldName?: 'slug' | 'slugNoSource'
  value?: SlugValue
  validation?: ValidationMarker[]
  readOnly?: boolean
  /** Render a visible inline error strip below the field (the Recommended fix). */
  showInlineError?: boolean
}

/**
 * Mounts the real `SlugInput` on the studio provider stack, wiring the knobs a story
 * needs. The `GetFormValueProvider` is what the Generate button reads its source
 * document from (`getFormValue([])`); the long tail of `ObjectInputProps` members the
 * component never reads is completed with `as unknown as`, mirroring the exemplar.
 */
function SlugFieldDemo(props: DemoProps) {
  const {fieldName = 'slug', validation = [], readOnly, showInlineError} = props

  const schema = useSchema()
  const postType = schema.get('post') as ObjectSchemaType
  const field = postType.fields.find((candidate) => candidate.name === fieldName)!
  const schemaType = field.type as SlugSchemaType

  const [value, setValue] = useState<SlugValue | undefined>(props.value)
  const inputRef = useRef<HTMLInputElement | null>(null)
  // Unique per mounted instance so the autodocs page (which embeds this demo once per
  // story) doesn't collide on a single fixed DOM id — the systemic duplicate-id finding.
  const inputId = `storybook-${fieldName}-${useId().replace(/:/g, '')}`

  const handleChange = useCallback((change: FormPatch | FormPatch[] | PatchEvent) => {
    setValue((prev) => applySlugPatches(prev, change))
  }, [])

  const inputProps = {
    schemaType,
    value,
    path: [fieldName],
    focusPath: [] as Path,
    focused: false,
    id: inputId,
    level: 0,
    changed: false,
    readOnly,
    validation,
    presence: [],
    elementProps: {
      'id': inputId,
      'onFocus': () => undefined,
      'onBlur': () => undefined,
      'ref': inputRef,
      'aria-describedby': undefined,
      'style': {},
    },
    onChange: handleChange,
  } as unknown as Parameters<typeof SlugInput>[0]

  const errorMessage = validation.find((item) => item.level === 'error')?.message

  return (
    <GetFormValueProvider value={hostDocument as never}>
      <Stack gap={3} style={{maxWidth: 480}}>
        <SlugInput {...inputProps} />
        {showInlineError && errorMessage && (
          <Card border padding={3} radius={2} tone="critical">
            <Text size={1}>{String(errorMessage)}</Text>
          </Card>
        )}
      </Stack>
    </GetFormValueProvider>
  )
}

/** Apply the slug input's emitted patches to a local `SlugValue` (set/setIfMissing/unset). */
function applySlugPatches(
  prev: SlugValue | undefined,
  change: FormPatch | FormPatch[] | PatchEvent,
): SlugValue | undefined {
  const patches: FormPatch[] = Array.isArray(change)
    ? change
    : 'patches' in change
      ? (change.patches as FormPatch[])
      : [change]
  let next: Record<string, unknown> | undefined = prev ? {...prev} : undefined
  for (const patch of patches) {
    const key = patch.path[0]
    if (patch.type === 'setIfMissing') {
      if (typeof key === 'string') {
        next = next ?? {}
        next[key] = next[key] ?? patch.value
      } else {
        next = next ?? {...(patch.value as Record<string, unknown>)}
      }
    } else if (patch.type === 'set') {
      if (typeof key === 'string') {
        next = next ?? {}
        next[key] = patch.value
      } else {
        next = {...(patch.value as Record<string, unknown>)}
      }
    } else if (patch.type === 'unset') {
      if (typeof key === 'string') {
        if (next) delete next[key]
      } else {
        next = undefined
      }
    }
  }
  return next as SlugValue | undefined
}

const meta: Meta = {
  title: 'Forms & Input/Slug',
  parameters: {
    // No meta-level `component`: each story drives state through field fixture rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'A slug validation failure hides its message behind a hover on a red-outlined field, ' +
            'and only fires on a Publish attempt, never on blur. The audit caught a literal ' +
            '`Dude, UPPERCASE!` shipping this way, but the point is that the editor cannot see it ' +
            'until they hover, far too late.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/Slug/SlugInput.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | CORE. The slug is the canonical URL identity of a document; generating and validating it is content-model machinery, not a commodity text field |',
          '| Audit | 🔴 needs-work (`error-messages`, `inline-validation-timing`, `forgiving-format`). A slug validation failure surfaces as `customValidity` on the native input: a red outline whose message is **hidden until you hover the field** (the audit’s literal "Dude, UPPERCASE!" finding), and it only fires on a Publish attempt, never on blur |',
          '| Patterns | `error-messages` · `inline-validation-timing` · `forgiving-format` |',
          '',
          'The field that holds a document’s URL-safe identifier, the `my-first-post` in a web ' +
            'address, with a one-click button to generate it from another field like the title.',
          '',
          'A slug is the human-readable, URL-safe name a document goes by on the front end, and ' +
            'this field is where it gets set. Point it at a source field (`options.source: ' +
            '"title"`) and a **Generate** button appears: press it and the real `slugify` ' +
            'pipeline turns "My First Post!" into `my-first-post`. Because the slug is a ' +
            'document’s public identity, generating and validating it is genuine content-model ' +
            'machinery, not a commodity text box. It sits in the CORE tier.',
          '',
          'The stories mount the **real** `SlugInput` on the full studio provider stack ' +
            '(`lib/testProvider.tsx`). The Generate button reads its source document from a ' +
            '`GetFormValueProvider` seeded with a `post` fixture whose `title` is the configured ' +
            '`source`; pressing it runs the real `slugify` pipeline against that title.',
          '',
          'Harness note: `SlugInput` calls `useGetFormValue()`, which **throws** outside a ' +
            '`GetFormValueProvider`, so every story wraps one (this is not in `FormStub`). The ' +
            'input is mounted bare, so document-level chrome (field label, change bar, ' +
            'publish-time validation trigger) is narrated by the stories rather than rendered.',
          '',
          '> **Why it matters:** a slug validation failure hides its message behind a hover on ' +
            'the red-outlined field, and only fires on a **Publish** attempt, never on blur. The ' +
            'audit caught a literal `Dude, UPPERCASE!` shipping this way, and the editor cannot ' +
            'see it until they hover, far too late.',
          '',
          'The page closes **in context**: the Slug field beneath the Title it generates from, ' +
            'as an editor authoring the "My First Post!" document.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: schemaTypes}},
    }),
  ],
  tags: [
    'autodocs',
    'chapter:forms',
    'chapter:cms',
    'pattern:error-messages',
    'pattern:inline-validation-timing',
    'pattern:forgiving-format',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/** No value: the empty text field plus the Generate button (source is configured). */
export const Empty: Story = {
  render: () => <SlugFieldDemo />,
}

/** A bound slug value: `{_type: 'slug', current: 'my-first-post'}`. */
export const WithValue: Story = {
  name: 'With value',
  render: () => <SlugFieldDemo value={{_type: 'slug', current: 'my-first-post'}} />,
}

/**
 * Generate-from-source. Press **Generate**; the input reads the `post` fixture’s
 * `title` ("My First Post!") through the real `slugify` pipeline and writes
 * `current: 'my-first-post'` into the field. Editing the field afterwards is free-form.
 */
export const GenerateFromSource: Story = {
  name: 'Generate from source',
  render: () => <SlugFieldDemo />,
}

/** No `source` option configured: the Generate button is absent (plain slug field). */
export const NoSource: Story = {
  name: 'No source (Generate hidden)',
  render: () => (
    <SlugFieldDemo fieldName="slugNoSource" value={{_type: 'slug', current: 'manual'}} />
  ),
}

const uppercaseError: ValidationMarker[] = [
  {
    level: 'error',
    // The audit found this literal string shipped as a slug validation message.
    message: 'Dude, UPPERCASE!',
    path: ['slug', 'current'],
  },
]

/**
 * **Current (audit finding).** `error-messages`: the slug fails validation, so the
 * component sets `customValidity` on the native `TextInput`. The result is a red-outlined
 * field whose message is **only visible on hover**; hover the input to reveal the
 * literal "Dude, UPPERCASE!" the audit captured. Nothing is shown inline, and (per
 * `inline-validation-timing`) in the real Studio this only appears after a Publish attempt.
 */
export const CurrentValidationError: Story = {
  name: 'Current (message hidden until hover)',
  tags: ['audit:needs-work'],
  render: () => (
    <SlugFieldDemo value={{_type: 'slug', current: 'My-First-Post'}} validation={uppercaseError} />
  ),
}

/**
 * **Recommended.** The same validation error, surfaced as a persistent inline strip
 * below the field with professional copy, legible without hover, and (the full fix)
 * evaluated on blur rather than only at publish time. The strip is prop-driven here;
 * the real input still owns the `customValidity` outline.
 */
export const RecommendedValidationError: Story = {
  name: 'Recommended (visible inline message)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => (
    <SlugFieldDemo
      value={{_type: 'slug', current: 'My-First-Post'}}
      validation={[
        {
          level: 'error',
          message: 'Slugs must be lowercase. Use letters, numbers, and hyphens only.',
          path: ['slug', 'current'],
        },
      ]}
      showInlineError
    />
  ),
}

/** Read-only: the field and Generate button are disabled. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => <SlugFieldDemo value={{_type: 'slug', current: 'my-first-post'}} readOnly />,
}

/**
 * In context: the Slug field as one field of the `post` being authored, sitting directly
 * beneath the Title it draws from. The Title card shows the configured `source`
 * ("My First Post!"); press **Generate** on the empty slug and the real `slugify`
 * pipeline turns that title above into `my-first-post`, exactly as it does in the
 * document pane. This is the everyday "name the URL" moment, not an isolated field.
 */
export const InContext: Story = {
  name: 'In context',
  render: () => (
    <Stack gap={4} style={{maxWidth: 480}}>
      <Stack gap={2}>
        <Text size={1} weight="medium">
          Title
        </Text>
        <Card border radius={2} padding={3}>
          <Text size={2}>My First Post!</Text>
        </Card>
      </Stack>
      <Stack gap={2}>
        <Text size={1} weight="medium">
          Slug
        </Text>
        <SlugFieldDemo />
      </Stack>
    </Stack>
  ),
}
