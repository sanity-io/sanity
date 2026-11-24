import {AddIcon} from '@sanity/icons/Add'
import {CloseIcon} from '@sanity/icons/Close'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {TrashIcon} from '@sanity/icons/Trash'
import {Button, Card, Stack, Switch, TextArea, TextInput} from '@sanity/ui'
import {Autocomplete} from '@sanity/ui/autocomplete'
import {dequal} from 'dequal/lite'
import JSON5 from 'json5'
import {
  type FocusEventHandler,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {type TFunction} from 'sanity'
import {InlineCode, useTranslation} from 'sanity/i18n'
import {Text, Box, Flex, Icon} from 'ui5'

import {type Params} from '../../../components/VisionGui'
import {visionLocaleNamespace} from '../../../i18n'
import {useParamsInference} from '../../hooks/useParamsInference'
import {cx} from '../../util/cx'
import {splitMessage} from '../../util/groqLint'
import {isObjectParam} from '../../util/objectParams'
import {type InferredParam, type ParamKind, type ParamType} from '../../util/paramInference'
import {type ParamLintFinding, withParamSuggestion} from '../../util/paramLint'
import * as fieldGrid from '../fieldGrid.module.css'
import * as styles from '../redesign.module.css'
import * as themeStyles from '../themeTokens.module.css'
import {VisionTooltip} from '../VisionTooltip'
import {DateTimePickerButton} from './DateTimePickerButton'
import {ObjectParamInput} from './ObjectParamInput'

type Translate = TFunction<typeof visionLocaleNamespace>

export interface ParamsFormProps {
  query: string
  params: Params
  /** Called with the params' new JSON */
  onChange: (rawParams: string) => void
  /** Enter in a field, which fetches like the fetch shortcut */
  onSubmit: () => void
  /** The query's lint findings about the params' values, shown at their param */
  lintFindings?: readonly ParamLintFinding[]
  /** Called when a finding's suggestion is applied */
  onApplySuggestion?: () => void
}

/**
 * Enter in a field that does not take it as input. The fetch shortcut (mod+Enter) is left to the
 * tool-wide handler, Enter that ends an IME composition stays with the composition, and a
 * multiline field or a button keeps its own Enter
 */
function isSubmitKey(event: KeyboardEvent<HTMLElement>): boolean {
  if (event.key !== 'Enter' || event.metaKey || event.ctrlKey || event.altKey) return false
  // oxlint-disable-next-line typescript/no-deprecated -- Safari reports the Enter that ends an IME composition with keyCode 229 and isComposing false
  if (event.nativeEvent.isComposing || event.keyCode === 229) return false
  const {target} = event
  return target instanceof HTMLSelectElement || target instanceof HTMLInputElement
}

function preview(value: unknown): string {
  const json = JSON.stringify(value) ?? String(value)
  return json.length > 40 ? `${json.slice(0, 39)}…` : json
}

function describeType(type: ParamType, t: Translate): string {
  let base: string
  switch (type.format ?? type.kind) {
    case 'document-type':
      base = t('vision.params-form.type.document-type')
      break
    case 'document-id':
      base = t('vision.params-form.type.document-id')
      break
    case 'datetime':
      base = t('vision.params-form.type.datetime')
      break
    case 'semantic-query':
    case 'string':
      base = t('vision.params-form.type.string')
      break
    case 'number':
      base = t('vision.params-form.type.number')
      break
    case 'integer':
      base = t('vision.params-form.type.integer')
      break
    case 'boolean':
      base = t('vision.params-form.type.boolean')
      break
    default:
      base = t('vision.params-form.type.any')
  }
  if (type.options && type.format !== 'document-type') {
    base = t('vision.params-form.type.options', {type: base, count: type.options.length})
  }
  if (type.min !== undefined && type.max !== undefined) {
    base = t('vision.params-form.type.range', {type: base, min: type.min, max: type.max})
  } else if (type.min !== undefined) {
    base = t('vision.params-form.type.min', {type: base, min: type.min})
  } else if (type.max !== undefined) {
    base = t('vision.params-form.type.max', {type: base, max: type.max})
  }
  return type.array ? t('vision.params-form.type.list', {type: base}) : base
}

/** Why a value does not fit what the query expects; the form sends it anyway, for testing */
function describeProblem(type: ParamType, value: unknown, t: Translate): string | undefined {
  if (type.array) {
    if (!Array.isArray(value)) return t('vision.params-form.invalid.list', {value: preview(value)})
    for (const item of value) {
      const problem = describeProblem({...type, array: false}, item, t)
      if (problem) return problem
    }
    return undefined
  }
  switch (type.kind) {
    case 'string':
      if (typeof value !== 'string') {
        return t('vision.params-form.invalid.string', {value: preview(value)})
      }
      if (type.options && !type.options.includes(value)) {
        return type.format === 'document-type'
          ? t('vision.params-form.invalid.document-type')
          : t('vision.params-form.invalid.option')
      }
      return undefined
    case 'integer':
    case 'number':
      if (typeof value !== 'number') return t('vision.params-form.invalid.number')
      if (type.kind === 'integer' && !Number.isInteger(value)) {
        return t('vision.params-form.invalid.integer')
      }
      if (type.min !== undefined && value < type.min) {
        return t('vision.params-form.invalid.min', {min: type.min})
      }
      if (type.max !== undefined && value > type.max) {
        return t('vision.params-form.invalid.max', {max: type.max})
      }
      return undefined
    case 'boolean':
      return typeof value === 'boolean'
        ? undefined
        : t('vision.params-form.invalid.boolean', {value: preview(value)})
    default:
      return undefined
  }
}

function toText(value: unknown, kind: ParamKind): string {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' && kind !== 'any') return String(value)
  return JSON.stringify(value) ?? ''
}

/** What text typed into a field sends: a number where one is expected and given, else the text */
function fromText(text: string, kind: ParamKind, empty: unknown): unknown {
  if (text === '') return empty
  if (kind === 'number' || kind === 'integer') {
    const number = Number(text)
    return text.trim() !== '' && Number.isFinite(number) ? number : text
  }
  // The items of a boolean list are typed in; a single boolean has its switch
  if (kind === 'boolean' && (text === 'true' || text === 'false')) return text === 'true'
  if (kind === 'any') {
    try {
      // Typed text never becomes null; optional params have a control for that
      const parsed: unknown = JSON5.parse(text)
      return parsed === null ? text : parsed
    } catch {
      return text
    }
  }
  return text
}

interface DocumentTypeOption {
  value: string
}

interface DocumentTypeInputProps {
  id?: string
  label?: string
  documentTypes: string[]
  value: unknown
  empty: unknown
  disabled: boolean
  invalid?: string
  placeholder: string
  onChange: (value: unknown) => void
}

function renderDocumentTypeOption(option: DocumentTypeOption) {
  return (
    <Card data-as="button" padding={2} radius={2} tone="inherit">
      <Text size={1} style={{color: 'var(--card-fg-color)'}} truncate={1} weight="medium">
        {option.value}
      </Text>
    </Card>
  )
}

/**
 * The document types of the schema to pick from, like Studio's autocompletes. Any other text is
 * still sent, for testing
 */
function DocumentTypeInput(props: DocumentTypeInputProps) {
  const {id, label, documentTypes, value, empty, disabled, invalid, placeholder, onChange} = props
  const fallbackId = useId()
  const text = toText(value, 'string')
  const options = useMemo(
    () => documentTypes.map((name): DocumentTypeOption => ({value: name})),
    [documentTypes],
  )
  // The text the list opened with. Opening reports that text as the query, and each keystroke is
  // stored, so the query and the stored text are the same string while typing; remembering the
  // opening text is what keeps that from matching every option, and from filtering to it on open.
  const openQuery = useRef<string | null>(null)
  const committed = useRef(text)
  useEffect(() => {
    committed.current = text
  }, [text])
  // Autocomplete clears its query when `value` changes, which would list every type again.
  // Hold the text the list opened with until the edit ends, and let the stored text move.
  const [heldValue, setHeldValue] = useState<string | null>(null)

  const filterOption = useCallback((query: string, option: DocumentTypeOption) => {
    // Opening fills the input with the current text, before that text has been edited
    if (openQuery.current === null && query === committed.current) openQuery.current = query
    if (query === openQuery.current) return true
    const normalized = query.trim().toLowerCase()
    return !normalized || option.value.toLowerCase().includes(normalized)
  }, [])

  const change = (next: string) => {
    if (next === text) return
    onChange(next === '' ? empty : next)
  }

  return (
    <Autocomplete
      aria-label={label}
      customValidity={invalid}
      disabled={disabled}
      filterOption={filterOption}
      fontSize={1}
      id={id ?? fallbackId}
      onChange={change}
      onQueryChange={(query) => {
        // `null` is the list closing
        if (query === null) {
          openQuery.current = null
          setHeldValue(null)
          return
        }
        setHeldValue((current) => current ?? openQuery.current ?? text)
        change(query)
      }}
      openButton
      options={options}
      placeholder={placeholder}
      popover={{
        className: cx(styles.popoverScroll, themeStyles.themeTokens),
        constrainSize: true,
        portal: true,
      }}
      renderOption={renderDocumentTypeOption}
      value={heldValue ?? text}
    />
  )
}

function scrollParent(element: HTMLElement): HTMLElement | Window {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const {overflowY} = window.getComputedStyle(parent)
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      parent.scrollHeight > parent.clientHeight
    )
      return parent
  }
  return window
}

/** A focused number input steps its value on wheel in Chromium; scroll instead, like Studio's */
function preventWheel(event: WheelEvent) {
  const input = event.currentTarget
  if (!(input instanceof HTMLElement) || document.activeElement !== input) return
  event.preventDefault()
  scrollParent(input).scrollBy({top: event.deltaY, left: event.deltaX, behavior: 'instant'})
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value)
  else if (ref) ref.current = value
}

/** The query text of `text::semanticSimilarity()`, one line tall until the text needs more */
function SearchText(props: {
  id?: string
  label?: string
  value: string
  disabled: boolean
  invalid?: string
  placeholder: string
  onChange: (value: string) => void
}) {
  const {id, label, value, disabled, invalid, placeholder, onChange} = props
  const areaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const element = areaRef.current
    // The field shows `value`; measure once that text is committed. An unmeasured field (no
    // layout) keeps the one-line height, and the field's max-height clamps a long one and scrolls
    if (!element || element.value !== value) return
    // Zero first, so a shorter value measures the content instead of the height it already has
    element.style.height = '0px'
    const next = element.scrollHeight
    if (next > 0) element.style.height = `${next}px`
  }, [value])

  return (
    <TextArea
      aria-label={label}
      className={fieldGrid.queryText}
      customValidity={invalid}
      disabled={disabled}
      fontSize={1}
      id={id}
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder={placeholder}
      ref={areaRef}
      rows={1}
      value={value}
    />
  )
}

interface ValueInputProps {
  id?: string
  /** For inputs no label points at (list items) */
  label?: string
  kind: ParamKind
  /** The bounds of a number input */
  bounds?: Pick<ParamType, 'min' | 'max' | 'step'>
  listId: string | undefined
  /** Picked from with an autocomplete instead of the suggestions list */
  documentTypes: string[] | undefined
  /** A semantic similarity query, typed across lines. Enter stays a newline */
  multiline?: boolean
  value: unknown
  /** What an emptied input sends: nothing for a param, an empty string for a list item */
  empty: unknown
  disabled: boolean
  /** Why the input is invalid, shown like a required Structure field */
  invalid?: string
  placeholder: string
  /** Shown at the end of the input, like the calendar button of a date and time param */
  suffix?: ReactNode
  ref?: Ref<HTMLInputElement>
  onChange: (value: unknown) => void
  onFocus?: FocusEventHandler<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
}

function ValueInput(props: ValueInputProps) {
  const {
    id,
    label,
    kind,
    bounds,
    listId,
    documentTypes,
    multiline,
    value,
    empty,
    disabled,
    invalid,
    placeholder,
  } = props
  const {ref, suffix, onChange, onFocus, onBlur} = props
  // The text as typed, for as long as it is what the param holds: "1." or "02" read as numbers,
  // and showing the number instead would rewrite the text under the caret
  const [draft, setDraft] = useState<{text: string; value: unknown}>()
  const text = draft && dequal(draft.value, value) ? draft.text : toText(value, kind)
  // A number input, like a Studio number field, unless the param holds something it cannot show
  const numeric =
    (kind === 'number' || kind === 'integer') && (value === undefined || typeof value === 'number')
  const [input, setInput] = useState<HTMLInputElement | null>(null)
  const inputRef = useCallback(
    (element: HTMLInputElement | null) => {
      setInput(element)
      assignRef(ref, element)
    },
    [ref],
  )

  useEffect(() => {
    if (!numeric || !input) return undefined
    input.addEventListener('wheel', preventWheel)
    return () => input.removeEventListener('wheel', preventWheel)
  }, [input, numeric])

  let step: number | 'any' | undefined
  let inputMode: 'numeric' | 'decimal' | 'text' | undefined
  if (numeric) {
    step = kind === 'integer' ? 1 : (bounds?.step ?? 'any')
    // Without a minus key on a numeric keypad, only an input that takes no negatives gets one
    const nonNegative = bounds?.min !== undefined && bounds.min >= 0
    if (nonNegative) inputMode = kind === 'integer' ? 'numeric' : 'decimal'
    else inputMode = 'text'
  }

  if (multiline) {
    return (
      <SearchText
        disabled={disabled}
        id={id}
        invalid={invalid}
        label={label}
        onChange={(next) => {
          const nextValue = fromText(next, kind, empty)
          setDraft({text: next, value: nextValue})
          onChange(nextValue)
        }}
        placeholder={placeholder}
        value={text}
      />
    )
  }

  if (documentTypes) {
    return (
      <DocumentTypeInput
        disabled={disabled}
        documentTypes={documentTypes}
        empty={empty}
        id={id}
        invalid={invalid}
        label={label}
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    )
  }

  return (
    <TextInput
      aria-label={label}
      customValidity={invalid}
      disabled={disabled}
      fontSize={1}
      id={id}
      inputMode={inputMode}
      list={listId}
      max={numeric ? bounds?.max : undefined}
      min={numeric ? bounds?.min : undefined}
      onBlur={onBlur}
      onChange={(event) => {
        const target = event.currentTarget
        const next = target.value
        // Text a number input cannot read (Firefox lets it be typed) leaves the param as it is
        if (numeric && next === '' && target.validity.badInput) return
        const nextValue = fromText(next, kind, empty)
        setDraft({text: next, value: nextValue})
        onChange(nextValue)
      }}
      onFocus={onFocus}
      placeholder={placeholder}
      ref={inputRef}
      step={step}
      suffix={suffix}
      type={numeric ? 'number' : undefined}
      value={text}
    />
  )
}

/** A boolean param, as the switch of a Studio boolean field; not set until it is switched */
function BooleanInput(props: {
  id: string
  value: unknown
  disabled: boolean
  invalid: string | undefined
  onChange: (value: unknown) => void
  onFocus?: FocusEventHandler<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
}) {
  const {id, value, disabled, invalid, onChange, onFocus, onBlur} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const isBoolean = typeof value === 'boolean'
  return (
    <Card border radius={2} tone={invalid ? 'critical' : undefined}>
      <Flex alignItems="center" gap={3} paddingX={3} paddingY={2}>
        <Switch
          checked={value === true}
          data-testid="vision-params-form-switch"
          disabled={disabled}
          id={id}
          indeterminate={!isBoolean}
          onBlur={onBlur}
          onChange={() => onChange(value !== true)}
          onFocus={onFocus}
        />
        <Text muted={!isBoolean} size={1} as="div" trim={true}>
          {isBoolean ? String(value) : t('vision.params-form.not-set')}
        </Text>
      </Flex>
    </Card>
  )
}

/** Items past this stay editable in the JSON view so the Form does not mount thousands of rows */
const MAX_FORM_LIST_ITEMS = 100

function ListInput(props: {
  param: InferredParam
  items: unknown[]
  listId: string | undefined
  documentTypes: string[] | undefined
  disabled: boolean
  onChange: (value: unknown) => void
}) {
  const {param, items, listId, documentTypes, disabled, onChange} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const {kind} = param.type
  const shown = items.slice(0, MAX_FORM_LIST_ITEMS)
  const truncated = items.length > MAX_FORM_LIST_ITEMS
  return (
    <Stack gap={2}>
      {shown.map((item, index) => (
        // Items have no identity of their own; an index keyed input shows the value it is given
        // oxlint-disable-next-line react/no-array-index-key
        <Flex alignItems="center" gap={1} key={index}>
          <Box flexBasis="0%" flexGrow={1} minWidth="0">
            <ValueInput
              bounds={param.type}
              disabled={disabled}
              documentTypes={documentTypes}
              empty=""
              kind={kind}
              label={t('vision.params-form.item-label', {name: param.name, index: index + 1})}
              listId={listId}
              onChange={(value) => onChange(items.map((it, i) => (i === index ? value : it)))}
              placeholder={t('vision.params-form.item-placeholder')}
              value={item}
            />
          </Box>
          <Button
            aria-label={t('vision.params-form.remove-item')}
            disabled={disabled}
            fontSize={1}
            icon={TrashIcon}
            mode="bleed"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            padding={2}
          />
        </Flex>
      ))}
      {truncated && (
        <Text
          data-testid={`vision-params-form-${param.name}-truncated`}
          muted
          size={1}
          as="div"
          trim={true}
        >
          {t('vision.params-form.list-truncated', {
            shown: MAX_FORM_LIST_ITEMS,
            count: items.length,
          })}
        </Text>
      )}
      <Flex>
        <Button
          data-testid={`vision-params-form-${param.name}-add`}
          disabled={disabled || truncated}
          fontSize={1}
          icon={AddIcon}
          mode="ghost"
          onClick={() => onChange([...items, kind === 'number' || kind === 'integer' ? 0 : ''])}
          padding={2}
          text={t('vision.params-form.add-item')}
        />
      </Flex>
    </Stack>
  )
}

function ParamField(props: {
  param: InferredParam
  value: unknown
  isSet: boolean
  disabled: boolean
  /** Whether the details say the types come from the query alone */
  schemaNote: boolean
  /** A key of an object param (`$range.min`), which the query reads as null when it is missing */
  nested?: boolean
  /** The query's lint findings about this param's value */
  lintFindings?: readonly ParamLintFinding[]
  onApplySuggestion?: () => void
  onChange: (value: unknown) => void
}) {
  const {param, value, isSet, disabled, schemaNote, nested, lintFindings, onChange} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const inputId = useId()
  const listId = useId()
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const {type} = param
  const options = type.options && type.options.length > 0 ? type.options : undefined
  const documentTypes = type.format === 'document-type' ? options : undefined
  const suggestionsListId = options && !documentTypes ? listId : undefined
  // A text field shows null as its placeholder, so the text "null" can be told apart and typed
  const isNull = value === null && !type.array
  const problem = isSet && !(isNull && param.nullable) ? describeProblem(type, value, t) : undefined
  const object = isObjectParam(param, value, isSet)

  const required = isSet || nested ? undefined : t('vision.params-form.required')

  let input
  if (object) {
    input = (
      <ObjectParamInput
        disabled={disabled}
        id={inputId}
        label={`$${param.name}`}
        onChange={onChange}
        param={param}
        renderField={(field, fieldValue, fieldIsSet, onFieldChange) => (
          <ParamField
            disabled={disabled}
            isSet={fieldIsSet}
            nested
            onChange={onFieldChange}
            param={{...field, name: `${param.name}.${field.name}`}}
            schemaNote={false}
            value={fieldValue}
          />
        )}
        value={value}
      />
    )
  } else if (type.kind === 'boolean' && !type.array) {
    input = (
      <BooleanInput
        disabled={disabled}
        id={inputId}
        invalid={required}
        onChange={onChange}
        value={value}
      />
    )
  } else if (type.array && (!isSet || Array.isArray(value))) {
    input = (
      <ListInput
        disabled={disabled}
        documentTypes={documentTypes}
        items={Array.isArray(value) ? value : []}
        listId={suggestionsListId}
        onChange={onChange}
        param={param}
      />
    )
  } else {
    let placeholder = t('vision.params-form.not-set')
    if (isNull) placeholder = t('vision.params-form.null')
    else if (type.kind === 'any' || type.array)
      placeholder = t('vision.params-form.any-placeholder')
    const datetime = type.format === 'datetime' && !type.array
    input = (
      <Flex alignItems="center" gap={1}>
        <Box flexBasis="0%" flexGrow={1} minWidth="0">
          <ValueInput
            bounds={type}
            disabled={disabled}
            documentTypes={type.array ? undefined : documentTypes}
            empty={undefined}
            id={inputId}
            invalid={required}
            kind={type.array ? 'any' : type.kind}
            listId={suggestionsListId}
            multiline={type.format === 'semantic-query' && !type.array}
            onChange={onChange}
            placeholder={placeholder}
            ref={datetime ? setInputElement : undefined}
            suffix={
              datetime ? (
                <DateTimePickerButton
                  disabled={disabled}
                  input={inputElement}
                  onChange={onChange}
                  value={value}
                />
              ) : undefined
            }
            value={isNull ? undefined : value}
          />
        </Box>
        {param.nullable && !type.array && (
          <Button
            aria-label={t('vision.params-form.clear', {name: param.name})}
            data-testid={`vision-params-form-${param.name}-clear`}
            disabled={disabled || value === null}
            fontSize={1}
            icon={CloseIcon}
            mode="bleed"
            onClick={() => onChange(null)}
            padding={2}
          />
        )}
      </Flex>
    )
  }

  const wide = !nested && type.format === 'semantic-query' && !type.array

  return (
    <Stack
      className={wide ? fieldGrid.wide : undefined}
      data-testid={`vision-params-form-${param.name}`}
      data-vision-param={param.name}
      gap={2}
    >
      <Flex alignItems="center" gap={1}>
        <Text as="label" htmlFor={inputId} size={1} weight="medium" trim={true}>
          <InlineCode>{`$${param.name}`}</InlineCode>
        </Text>
        <InfoTip
          label={t('vision.params-form.details', {name: param.name})}
          testId={`vision-params-form-${param.name}-details`}
        >
          <Text data-testid={`vision-params-form-${param.name}-type`} size={1} as="div" trim>
            {t('vision.params-form.type-detail', {
              type: object ? t('vision.params-form.type.object') : describeType(type, t),
            })}
          </Text>
          {param.usages.length > 0 && (
            <Text size={1} as="div" trim={true}>
              {t('vision.params-form.used-in')}{' '}
              {param.usages.map((usage, index) => (
                <span key={usage}>
                  {index > 0 && ', '}
                  <InlineCode>{usage}</InlineCode>
                </span>
              ))}
            </Text>
          )}
          {schemaNote && (
            <Text muted size={1} as="div" trim={true}>
              {t('vision.params-form.no-schema')}
            </Text>
          )}
        </InfoTip>
        {required && (
          <VisionTooltip
            content={
              <Flex alignItems="center" gap={2}>
                <Icon icon={ErrorOutlineIcon} size={1} tone="critical" />
                <Text size={1} as="div" trim={true}>
                  {required}
                </Text>
              </Flex>
            }
            placement="top"
          >
            <Box data-testid={`vision-params-form-${param.name}-required`} paddingX={1}>
              <Icon aria-label={required} icon={ErrorOutlineIcon} size={1} tone="critical" />
            </Box>
          </VisionTooltip>
        )}
      </Flex>
      {input}
      {suggestionsListId && options && (
        <datalist id={suggestionsListId}>
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
      {lintFindings?.map((finding) => {
        const {suggestion} = finding.param
        return (
          <Card
            data-testid={`vision-params-form-${param.name}-lint`}
            key={`${finding.from}:${finding.message}`}
            padding={2}
            radius={2}
            tone="caution"
          >
            <Flex alignItems="center" gap={2}>
              <Box flexBasis="0%" flexGrow={1} minWidth="0">
                <Text size={1} as="div" trim={true} tone="caution">
                  {splitMessage(finding.message).map((segment, index) =>
                    segment.code ? (
                      <InlineCode key={index}>{segment.text}</InlineCode>
                    ) : (
                      <span key={index}>{segment.text}</span>
                    ),
                  )}
                </Text>
              </Box>
              {suggestion !== undefined && (
                <Button
                  data-testid={`vision-params-form-${param.name}-lint-fix`}
                  disabled={disabled}
                  fontSize={1}
                  mode="ghost"
                  onClick={() => {
                    props.onApplySuggestion?.()
                    onChange(withParamSuggestion(value, finding.param))
                  }}
                  padding={2}
                  text={t('vision.lint.use-suggestion', {suggestion: JSON.stringify(suggestion)})}
                />
              )}
            </Flex>
          </Card>
        )
      })}
      {problem && (
        <Card
          data-testid={`vision-params-form-${param.name}-problem`}
          padding={2}
          radius={2}
          tone="caution"
        >
          <Text size={1} as="div" trim={true} tone="caution">
            {problem}
          </Text>
        </Card>
      )}
    </Stack>
  )
}

/** A pressable info icon, with the details in its tooltip */
function InfoTip(props: {label: string; testId: string; children: ReactNode}) {
  const {label, testId, children} = props
  return (
    <VisionTooltip
      content={
        <Stack data-testid={`${testId}-content`} gap={2}>
          {children}
        </Stack>
      }
      placement="top"
    >
      <Button
        aria-label={label}
        data-testid={testId}
        fontSize={1}
        icon={InfoOutlineIcon}
        mode="bleed"
        padding={1}
      />
    </VisionTooltip>
  )
}

/**
 * A form for the params a query uses, inferred from the query (and the workspace
 * schema, like typegen). Values that fit are easy to enter (document types and option lists are
 * suggested, numbers become numbers), and values that do not are still sent, for testing.
 */
export function ParamsForm({
  query,
  params,
  onChange,
  onSubmit,
  lintFindings,
  onApplySuggestion,
}: ParamsFormProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const inference = useParamsInference(query)
  const values = params.parsed ?? {}
  const disabled = !params.valid
  const known = new Set(inference.params.map((param) => param.name))
  const unused = params.valid ? Object.keys(values).filter((name) => !known.has(name)) : []

  const setValue = (name: string, value: unknown) => {
    const next =
      value === undefined
        ? Object.fromEntries(Object.entries(values).filter(([key]) => key !== name))
        : {...values, [name]: value}
    onChange(JSON.stringify(next, null, 2))
  }
  const removeUnused = () => {
    const next = Object.fromEntries(Object.entries(values).filter(([key]) => known.has(key)))
    onChange(JSON.stringify(next, null, 2))
  }

  const schemaUnavailable = inference.params.length > 0 && inference.schemaUnavailable
  // The note sits by the unused heading when there is one, and in each param's details otherwise
  const schemaNoteInDetails = schemaUnavailable && unused.length === 0

  return (
    <Stack
      data-testid="vision-params-form"
      gap={4}
      onKeyDown={(event) => {
        if (!isSubmitKey(event)) return
        event.preventDefault()
        onSubmit()
      }}
      padding={3}
    >
      {inference.syntaxError && (
        <Text muted size={1} as="div" trim={true}>
          {t('vision.params-form.syntax-error')}
        </Text>
      )}
      {inference.params.length === 0 && unused.length === 0 && (
        <Text muted size={1} as="div" trim={true}>
          {t('vision.params-form.empty')}
        </Text>
      )}
      {inference.params.length > 0 && (
        <div className={fieldGrid.container}>
          <div className={fieldGrid.fieldGrid}>
            {inference.params.map((param) => (
              <ParamField
                disabled={disabled}
                isSet={Object.hasOwn(values, param.name)}
                key={param.name}
                lintFindings={lintFindings?.filter((finding) => finding.param.name === param.name)}
                onApplySuggestion={onApplySuggestion}
                onChange={(value) => setValue(param.name, value)}
                param={param}
                schemaNote={schemaNoteInDetails}
                value={values[param.name]}
              />
            ))}
          </div>
        </div>
      )}
      {unused.length > 0 && (
        <Stack data-testid="vision-params-form-unused" gap={2}>
          <Flex alignItems="center" gap={1}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              {t('vision.params-form.unused')}
            </Text>
            {schemaUnavailable && (
              <InfoTip
                label={t('vision.params-form.types-details')}
                testId="vision-params-form-no-schema"
              >
                <Text size={1} as="div" trim={true}>
                  {t('vision.params-form.no-schema')}
                </Text>
              </InfoTip>
            )}
            <Box flexGrow={1} />
            <Button
              data-testid="vision-params-form-remove-all"
              fontSize={1}
              mode="bleed"
              onClick={removeUnused}
              padding={2}
              text={t('vision.params-form.remove-all')}
            />
          </Flex>
          {unused.map((name) => (
            <Flex alignItems="center" gap={2} key={name}>
              <Text size={1} as="div" trim={true}>
                <InlineCode>{`$${name}`}</InlineCode>
              </Text>
              <Box flexBasis="0%" flexGrow={1} minWidth="0">
                <Text muted size={1} truncate={1} as="div" trim={true}>
                  {preview(values[name])}
                </Text>
              </Box>
              <Button
                fontSize={1}
                mode="bleed"
                onClick={() => setValue(name, undefined)}
                padding={2}
                text={t('vision.params-form.remove')}
              />
            </Flex>
          ))}
        </Stack>
      )}
      {/* Under the fields, so they stay put while the JSON goes in and out of parsing */}
      {disabled && (
        <Card data-testid="vision-params-form-invalid-json" padding={3} radius={2} tone="caution">
          <Text size={1} as="div" trim={true} tone="caution">
            {t('vision.params-form.invalid-json')}
          </Text>
        </Card>
      )}
    </Stack>
  )
}
