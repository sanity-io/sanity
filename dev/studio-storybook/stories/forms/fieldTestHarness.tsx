/**
 * Shared harness for the primitive **Forms & Input** stories.
 *
 * Mounts a real Studio form input inside the real `FormField` chrome — label,
 * description, and the validation marker — so every story renders the input *as the
 * document form actually renders it*, not as the bare `@sanity/ui` primitive. This
 * mirrors `core/form/members/object/fields/PrimitiveField.tsx`, which is the real
 * member renderer: it computes `validationError` (all error messages joined) and
 * hands the same `validation` array to both the input (→ `customValidity`, the tinted
 * field) and to `FormField` (→ the header's hover-only validation icon). Reproducing
 * that split is the whole point of the form-legibility audit stories.
 *
 * Requires `WithStudioProviders`: `FormField` reads `useWorkspace()` (via
 * `FormNodeDivergenceDetail`) and `FormFieldHeaderText` reads the i18n locale, both of
 * which the studio provider stack supplies. The two field-level contexts it also
 * touches (`FieldActionsContext`, `DocumentDivergencesContext`) have safe disabled
 * defaults, so no document store is needed.
 *
 * `ChangeIndicatorsTracker` (mounted below) is NOT optional for the inputs that wrap
 * their content in `ChangeIndicator` (Select, Tags). Without it the reporter hook's
 * store context is null and `useChangeIndicatorsReporter` fires
 * `console.warn(new Error(...))` on EVERY render — not once — capturing a stack trace
 * each time (`core/changeIndicators/tracker.tsx:66`). Under re-render pressure
 * (story cycling, value changes, HMR refresh) that floods the console and was the
 * measured accomplice in the SelectInput freeze investigated 2026-07-23. The real
 * Studio always renders fields under this tracker (`ChangeConnectorRoot` in
 * `structure/panes/document/document-layout/DocumentLayout.tsx`), so mounting it is
 * also the higher-fidelity composition. It is context-only (renders no DOM), and its
 * update path is debounce-published with no overlay subscribers in stories, so it
 * cannot feed back into render.
 */
import {type FormNodeValidation, type ObjectSchemaType, type Path} from '@sanity/types'
import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import {ChangeIndicatorsTracker} from '../../../../packages/sanity/src/core/changeIndicators/tracker'
import {FormField} from '../../../../packages/sanity/src/core/form/components/formField/FormField'
import {BooleanInput} from '../../../../packages/sanity/src/core/form/inputs/BooleanInput'
import {EmailInput} from '../../../../packages/sanity/src/core/form/inputs/EmailInput'
import {NumberInput} from '../../../../packages/sanity/src/core/form/inputs/NumberInput/NumberInput'
import {SelectInput} from '../../../../packages/sanity/src/core/form/inputs/SelectInput'
import {StringInput} from '../../../../packages/sanity/src/core/form/inputs/StringInput/StringInput'
import {TagsArrayInput} from '../../../../packages/sanity/src/core/form/inputs/TagsArrayInput'
import {TelephoneInput} from '../../../../packages/sanity/src/core/form/inputs/TelephoneInput'
import {TextInput} from '../../../../packages/sanity/src/core/form/inputs/TextInput'
import {UrlInput} from '../../../../packages/sanity/src/core/form/inputs/UrlInput'
import {type FormPatch} from '../../../../packages/sanity/src/core/form/patch/types'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'

/** Which real input the harness mounts. Selects both the component and the value wiring. */
export type FieldKind =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'email'
  | 'url'
  | 'tel'
  | 'tags'

/** Kinds whose value updates arrive through the native DOM `onChange` (text field / switch). */
const NATIVE_VALUE_KINDS = new Set<FieldKind>([
  'string',
  'text',
  'number',
  'boolean',
  'email',
  'url',
  'tel',
])

/**
 * Collapse a patch (or PatchEvent) to the next field value for the root path. Select and
 * Tags emit `set(value)` / `unset()` at the field root — the only shapes we mirror here.
 */
function applyRootPatch(change: FormPatch | FormPatch[] | {patches: FormPatch[]}): unknown {
  const patches: FormPatch[] = Array.isArray(change)
    ? change
    : 'patches' in change
      ? change.patches
      : [change]
  let next: unknown = undefined
  for (const patch of patches) {
    if (patch.type === 'set') next = patch.value
    else if (patch.type === 'unset') next = undefined
  }
  return next
}

export interface FieldDemoProps {
  /** Document type name compiled into the story file's `WithStudioProviders` schema. */
  documentType: string
  /** Field on that document to render. Its schema drives placeholder, options, and title. */
  fieldName: string
  kind: FieldKind
  /** Initial field value. */
  value?: unknown
  readOnly?: boolean
  /**
   * Validation entries. Drives the `FormField` header marker (icon + hover tooltip) AND
   * the input's `customValidity` tint — exactly the pair `PrimitiveField` produces.
   */
  validation?: FormNodeValidation[]
  /**
   * Render the input inside the real `FormField` chrome (default). `BooleanInput` builds
   * its own header, so its stories pass `chrome={false}`.
   */
  chrome?: boolean
  /** Override the label; defaults to the schema field's `title`. */
  title?: ReactNode
  /** Override the description; defaults to the schema field's `description`. */
  description?: ReactNode
  /** Extra content rendered after the input, inside the field body (e.g. a recommended inline message). */
  footer?: ReactNode
  /** Controlled value handoff — when set, the parent owns the value (for interactive stories). */
  onValueChange?: (value: unknown) => void
  /** Fires when the input blurs — the seam the `inline-validation-timing` fix hooks into. */
  onInputBlur?: () => void
}

/**
 * The realistic field composition: real input + real `FormField` chrome, wired so the
 * value is editable and validation renders through the shipped markers.
 */
export function FieldDemo(props: FieldDemoProps) {
  const {
    documentType,
    fieldName,
    kind,
    readOnly,
    validation = [],
    chrome = true,
    footer,
    onValueChange,
    onInputBlur,
  } = props

  const schema = useSchema()
  const docType = schema.get(documentType) as ObjectSchemaType
  const field = docType.fields.find((candidate) => candidate.name === fieldName)!
  const schemaType = field.type

  const [innerValue, setInnerValue] = useState<unknown>(props.value)
  const value = onValueChange ? props.value : innerValue
  const setValue = onValueChange ?? setInnerValue

  const inputRef = useRef<HTMLInputElement | null>(null)
  // Unique per mounted instance so the autodocs page (which embeds this demo once per
  // story) doesn't collide on a single fixed DOM id — the systemic duplicate-id finding.
  const inputId = `sb-${documentType}-${fieldName}-${useId().replace(/:/g, '')}`
  const path: Path = useMemo(() => [fieldName], [fieldName])

  const validationError =
    validation
      .filter((item) => item.level === 'error')
      .map((item) => item.message)
      .join('\n') || undefined

  const handleNativeChange = useCallback(
    (event: {currentTarget: HTMLInputElement}) => {
      setValue(kind === 'boolean' ? event.currentTarget.checked : event.currentTarget.value)
    },
    [kind, setValue],
  )

  const handlePatchChange = useCallback(
    (change: FormPatch | FormPatch[] | {patches: FormPatch[]}) => {
      setValue(applyRootPatch(change))
    },
    [setValue],
  )

  const handleBlur = useCallback(() => onInputBlur?.(), [onInputBlur])

  const isNativeValueKind = NATIVE_VALUE_KINDS.has(kind)

  const elementProps = {
    'id': inputId,
    'readOnly': Boolean(readOnly),
    // oxlint-disable-next-line no-deprecated -- schemaType.placeholder is still read directly by real code (TextInput.tsx, PrimitiveField.tsx, ArrayOfPrimitivesItem.tsx)
    'placeholder': schemaType.placeholder,
    'autoComplete': 'off',
    'onFocus': () => undefined,
    'onBlur': handleBlur,
    'ref': inputRef,
    'aria-describedby': undefined,
    'style': {},
    // Text fields and the boolean switch report changes through the native DOM `onChange`.
    // Select and Tags do NOT: they emit patches via the input's own `onChange`, and their
    // real `elementProps` (ComplexElementProps) carries no `onChange` — adding one here would
    // clobber `TagsArrayInput`'s handler (spread last), so it is deliberately omitted.
    // Text fields stay controlled with '' when empty; the boolean switch takes no `value`
    // (its `checked` comes from the input's `value` prop, set on `baseProps`).
    ...(isNativeValueKind
      ? {
          value:
            kind === 'boolean'
              ? undefined
              : typeof value === 'number'
                ? String(value)
                : ((value as string | undefined) ?? ''),
          onChange: handleNativeChange,
        }
      : {}),
  }

  // The long tail of `*InputProps` members the primitive inputs never read is completed
  // with `as unknown as` — the same idiom the ReferenceInput story and the component's own
  // test harness use. Everything each input *does* read is passed for real.
  const baseProps = {
    schemaType,
    value,
    validation,
    validationError,
    readOnly,
    id: inputId,
    path,
    level: 1,
    focused: false,
    changed: false,
    presence: [],
    focusPath: [] as Path,
    onChange: handlePatchChange,
    onFocus: () => undefined,
    onBlur: handleBlur,
    onPathFocus: () => undefined,
    onPathBlur: () => undefined,
    elementProps,
  }

  const input = <FieldInput kind={kind} baseProps={baseProps} />

  if (!chrome) {
    return (
      <ChangeIndicatorsTracker>
        <div style={{maxWidth: 420}}>
          {input}
          {footer}
        </div>
      </ChangeIndicatorsTracker>
    )
  }

  return (
    <ChangeIndicatorsTracker>
      <div style={{maxWidth: 420}}>
        <FormField
          // FormFieldProps doesn't exclude the native `title` HTML attribute from its
          // Omit<HTMLProps>, so its own `title?: ReactNode` intersects with the native
          // `title?: string` - this harness deliberately allows a ReactNode override, so
          // assert past that self-intersection.
          title={(props.title ?? schemaType.title) as unknown as string}
          description={props.description ?? schemaType.description}
          inputId={inputId}
          level={1}
          path={path}
          validation={validation}
        >
          {input}
          {footer}
        </FormField>
      </div>
    </ChangeIndicatorsTracker>
  )
}

/**
 * Renders the real input for `kind`, casting the one assembled prop bag to each input's own
 * props type — the `as unknown as` idiom the ReferenceInput story and the inputs' test
 * harnesses use for the members the primitive inputs never read. A component (not a bare
 * function) so the `ref` inside `baseProps` flows as a prop, satisfying the React compiler.
 */
function FieldInput({kind, baseProps}: {kind: FieldKind; baseProps: Record<string, unknown>}) {
  switch (kind) {
    case 'text':
      return <TextInput {...(baseProps as unknown as ComponentProps<typeof TextInput>)} />
    case 'number':
      return <NumberInput {...(baseProps as unknown as ComponentProps<typeof NumberInput>)} />
    case 'boolean':
      return <BooleanInput {...(baseProps as unknown as ComponentProps<typeof BooleanInput>)} />
    case 'select':
      return <SelectInput {...(baseProps as unknown as ComponentProps<typeof SelectInput>)} />
    case 'email':
      return <EmailInput {...(baseProps as unknown as ComponentProps<typeof EmailInput>)} />
    case 'url':
      return <UrlInput {...(baseProps as unknown as ComponentProps<typeof UrlInput>)} />
    case 'tel':
      return <TelephoneInput {...(baseProps as unknown as ComponentProps<typeof TelephoneInput>)} />
    case 'tags':
      return <TagsArrayInput {...(baseProps as unknown as ComponentProps<typeof TagsArrayInput>)} />
    default:
      return <StringInput {...(baseProps as unknown as ComponentProps<typeof StringInput>)} />
  }
}
