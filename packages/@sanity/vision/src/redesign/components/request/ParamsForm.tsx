import {AddIcon} from '@sanity/icons/Add'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {TrashIcon} from '@sanity/icons/Trash'
import {Button, Card, Select, Stack, TextInput} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {dequal} from 'dequal/lite'
import JSON5 from 'json5'
import {type ReactNode, useId, useState} from 'react'
import {InlineCode, type TFunction, useTranslation} from 'sanity'
import {Text, Box, Flex, Icon} from 'ui5'

import {type Params} from '../../../components/VisionGui'
import {visionLocaleNamespace} from '../../../i18n'
import {useParamsInference} from '../../hooks/useParamsInference'
import {type InferredParam, type ParamKind, type ParamType} from '../../util/paramInference'

type Translate = TFunction<typeof visionLocaleNamespace>

export interface ParamsFormProps {
  query: string
  params: Params
  /** Called with the params' new JSON */
  onChange: (rawParams: string) => void
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
      if (typeof value === 'number' && !Number.isInteger(value)) {
        return t('vision.params-form.invalid.integer')
      }
      return typeof value === 'number' ? undefined : t('vision.params-form.invalid.number')
    case 'number':
      return typeof value === 'number' ? undefined : t('vision.params-form.invalid.number')
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
  // The items of a boolean list are typed in; a single boolean has its select
  if (kind === 'boolean' && (text === 'true' || text === 'false')) return text === 'true'
  if (kind === 'any') {
    try {
      return JSON5.parse(text)
    } catch {
      return text
    }
  }
  return text
}

interface ValueInputProps {
  id?: string
  /** For inputs no label points at (list items) */
  label?: string
  kind: ParamKind
  listId: string | undefined
  value: unknown
  /** What an emptied input sends: nothing for a param, an empty string for a list item */
  empty: unknown
  disabled: boolean
  /** Why the input is invalid, shown like a required Structure field */
  invalid?: string
  placeholder: string
  onChange: (value: unknown) => void
}

function ValueInput(props: ValueInputProps) {
  const {id, label, kind, listId, value, empty, disabled, invalid, placeholder, onChange} = props
  // The text as typed, for as long as it is what the param holds: "1." or "02" read as numbers,
  // and showing the number instead would rewrite the text under the caret
  const [draft, setDraft] = useState<{text: string; value: unknown}>()
  const text = draft && dequal(draft.value, value) ? draft.text : toText(value, kind)

  return (
    <TextInput
      aria-label={label}
      customValidity={invalid}
      disabled={disabled}
      fontSize={1}
      id={id}
      inputMode={kind === 'number' || kind === 'integer' ? 'decimal' : undefined}
      list={listId}
      onChange={(event) => {
        const next = event.currentTarget.value
        const nextValue = fromText(next, kind, empty)
        setDraft({text: next, value: nextValue})
        onChange(nextValue)
      }}
      placeholder={placeholder}
      value={text}
    />
  )
}

function BooleanInput(props: {
  id: string
  value: unknown
  isSet: boolean
  disabled: boolean
  invalid: string | undefined
  onChange: (value: unknown) => void
}) {
  const {id, value, isSet, disabled, invalid, onChange} = props
  const {t} = useTranslation(visionLocaleNamespace)
  let selected = ''
  if (typeof value === 'boolean') selected = String(value)
  else if (isSet) selected = 'other'
  return (
    <Select
      customValidity={invalid}
      disabled={disabled}
      fontSize={1}
      id={id}
      onChange={(event) => {
        const next = event.currentTarget.value
        if (next === 'other') return
        onChange(next === '' ? undefined : next === 'true')
      }}
      value={selected}
    >
      <option value="">{t('vision.params-form.not-set')}</option>
      <option value="true">{String(true)}</option>
      <option value="false">{String(false)}</option>
      {selected === 'other' && <option value="other">{preview(value)}</option>}
    </Select>
  )
}

function ListInput(props: {
  param: InferredParam
  items: unknown[]
  listId: string | undefined
  disabled: boolean
  onChange: (value: unknown) => void
}) {
  const {param, items, listId, disabled, onChange} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const {kind} = param.type
  return (
    <Stack gap={2}>
      {items.map((item, index) => (
        // Items have no identity of their own; an index keyed input shows the value it is given
        // oxlint-disable-next-line react/no-array-index-key
        <Flex alignItems="center" gap={1} key={index}>
          <Box flexBasis="0%" flexGrow={1} minWidth="0">
            <ValueInput
              disabled={disabled}
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
      <Flex>
        <Button
          data-testid={`vision-params-form-${param.name}-add`}
          disabled={disabled}
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
  onChange: (value: unknown) => void
}) {
  const {param, value, isSet, disabled, schemaNote, onChange} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const inputId = useId()
  const listId = useId()
  const {type} = param
  const options = type.options && type.options.length > 0 ? type.options : undefined
  const problem = isSet ? describeProblem(type, value, t) : undefined

  const required = isSet ? undefined : t('vision.params-form.required')

  let input
  if (type.kind === 'boolean' && !type.array) {
    input = (
      <BooleanInput
        disabled={disabled}
        id={inputId}
        invalid={required}
        isSet={isSet}
        onChange={onChange}
        value={value}
      />
    )
  } else if (type.array && (!isSet || Array.isArray(value))) {
    input = (
      <ListInput
        disabled={disabled}
        items={Array.isArray(value) ? value : []}
        listId={options && listId}
        onChange={onChange}
        param={param}
      />
    )
  } else {
    input = (
      <Flex alignItems="center" gap={1}>
        <Box flexBasis="0%" flexGrow={1} minWidth="0">
          <ValueInput
            disabled={disabled}
            empty={undefined}
            id={inputId}
            invalid={required}
            kind={type.array ? 'any' : type.kind}
            listId={options && listId}
            onChange={onChange}
            placeholder={
              type.kind === 'any' || type.array
                ? t('vision.params-form.any-placeholder')
                : t('vision.params-form.not-set')
            }
            value={value}
          />
        </Box>
        {type.format === 'datetime' && (
          <Button
            disabled={disabled}
            fontSize={1}
            mode="ghost"
            onClick={() => onChange(new Date().toISOString())}
            padding={2}
            text={t('vision.params-form.now')}
          />
        )}
      </Flex>
    )
  }

  return (
    <Stack data-testid={`vision-params-form-${param.name}`} gap={2}>
      <Flex alignItems="center" gap={1}>
        <Text as="label" htmlFor={inputId} size={1} weight="medium" trim={true}>
          <InlineCode>{`$${param.name}`}</InlineCode>
        </Text>
        <InfoTip
          label={t('vision.params-form.details', {name: param.name})}
          testId={`vision-params-form-${param.name}-details`}
        >
          <Text data-testid={`vision-params-form-${param.name}-type`} size={1} as="div" trim>
            {t('vision.params-form.type-detail', {type: describeType(type, t)})}
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
          <Tooltip
            animate
            content={
              <Flex alignItems="center" gap={2}>
                <Icon icon={ErrorOutlineIcon} size={1} tone="critical" />
                <Text size={1} as="div" trim={true}>
                  {required}
                </Text>
              </Flex>
            }
            placement="top"
            portal
          >
            <Box data-testid={`vision-params-form-${param.name}-required`} paddingX={1}>
              <Icon aria-label={required} icon={ErrorOutlineIcon} size={1} tone="critical" />
            </Box>
          </Tooltip>
        )}
      </Flex>
      {input}
      {options && (
        <datalist id={listId}>
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
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
    <Tooltip
      animate
      content={
        <Stack data-testid={`${testId}-content`} gap={2}>
          {children}
        </Stack>
      }
      placement="top"
      portal
    >
      <Button
        aria-label={label}
        data-testid={testId}
        fontSize={1}
        icon={InfoOutlineIcon}
        mode="bleed"
        padding={1}
      />
    </Tooltip>
  )
}

/**
 * A form for the params a query uses, inferred from the query (and the workspace
 * schema, like typegen). Values that fit are easy to enter (document types and option lists are
 * suggested, numbers become numbers), and values that do not are still sent, for testing.
 */
export function ParamsForm({query, params, onChange}: ParamsFormProps) {
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
    <Stack data-testid="vision-params-form" gap={4} padding={3}>
      {disabled && (
        <Card padding={3} radius={2} tone="caution">
          <Text size={1} as="div" trim={true} tone="caution">
            {t('vision.params-form.invalid-json')}
          </Text>
        </Card>
      )}
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
      {inference.params.map((param) => (
        <ParamField
          disabled={disabled}
          isSet={Object.hasOwn(values, param.name)}
          key={param.name}
          onChange={(value) => setValue(param.name, value)}
          param={param}
          schemaNote={schemaNoteInDetails}
          value={values[param.name]}
        />
      ))}
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
    </Stack>
  )
}
