import {AddIcon} from '@sanity/icons/Add'
import {TrashIcon} from '@sanity/icons/Trash'
import {Button, Card, Select, Stack, Text, TextInput} from '@sanity/ui'
import {dequal} from 'dequal/lite'
import JSON5 from 'json5'
import {useId, useState} from 'react'
import {type TFunction, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

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
      base = t('vista.params-form.type.document-type')
      break
    case 'document-id':
      base = t('vista.params-form.type.document-id')
      break
    case 'datetime':
      base = t('vista.params-form.type.datetime')
      break
    case 'string':
      base = t('vista.params-form.type.string')
      break
    case 'number':
      base = t('vista.params-form.type.number')
      break
    case 'integer':
      base = t('vista.params-form.type.integer')
      break
    case 'boolean':
      base = t('vista.params-form.type.boolean')
      break
    default:
      base = t('vista.params-form.type.any')
  }
  if (type.options && type.format !== 'document-type') {
    base = t('vista.params-form.type.options', {type: base, count: type.options.length})
  }
  return type.array ? t('vista.params-form.type.list', {type: base}) : base
}

/** Why a value does not fit what the query expects; the form sends it anyway, for testing */
function describeProblem(type: ParamType, value: unknown, t: Translate): string | undefined {
  if (type.array) {
    if (!Array.isArray(value)) return t('vista.params-form.invalid.list', {value: preview(value)})
    for (const item of value) {
      const problem = describeProblem({...type, array: false}, item, t)
      if (problem) return problem
    }
    return undefined
  }
  switch (type.kind) {
    case 'string':
      if (typeof value !== 'string') {
        return t('vista.params-form.invalid.string', {value: preview(value)})
      }
      if (type.options && !type.options.includes(value)) {
        return type.format === 'document-type'
          ? t('vista.params-form.invalid.document-type')
          : t('vista.params-form.invalid.option')
      }
      return undefined
    case 'integer':
      if (typeof value === 'number' && !Number.isInteger(value)) {
        return t('vista.params-form.invalid.integer')
      }
      return typeof value === 'number' ? undefined : t('vista.params-form.invalid.number')
    case 'number':
      return typeof value === 'number' ? undefined : t('vista.params-form.invalid.number')
    case 'boolean':
      return typeof value === 'boolean'
        ? undefined
        : t('vista.params-form.invalid.boolean', {value: preview(value)})
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
  placeholder: string
  onChange: (value: unknown) => void
}

function ValueInput(props: ValueInputProps) {
  const {id, label, kind, listId, value, empty, disabled, placeholder, onChange} = props
  // The text as typed, for as long as it is what the param holds: "1." or "02" read as numbers,
  // and showing the number instead would rewrite the text under the caret
  const [draft, setDraft] = useState<{text: string; value: unknown}>()
  const text = draft && dequal(draft.value, value) ? draft.text : toText(value, kind)

  return (
    <TextInput
      aria-label={label}
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
  onChange: (value: unknown) => void
}) {
  const {id, value, isSet, disabled, onChange} = props
  const {t} = useTranslation(visionLocaleNamespace)
  let selected = ''
  if (typeof value === 'boolean') selected = String(value)
  else if (isSet) selected = 'other'
  return (
    <Select
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
      <option value="">{t('vista.params-form.not-set')}</option>
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
              label={t('vista.params-form.item-label', {name: param.name, index: index + 1})}
              listId={listId}
              onChange={(value) => onChange(items.map((it, i) => (i === index ? value : it)))}
              placeholder={t('vista.params-form.item-placeholder')}
              value={item}
            />
          </Box>
          <Button
            aria-label={t('vista.params-form.remove-item')}
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
          data-testid={`vista-params-form-${param.name}-add`}
          disabled={disabled}
          fontSize={1}
          icon={AddIcon}
          mode="ghost"
          onClick={() => onChange([...items, kind === 'number' || kind === 'integer' ? 0 : ''])}
          padding={2}
          text={t('vista.params-form.add-item')}
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
  onChange: (value: unknown) => void
}) {
  const {param, value, isSet, disabled, onChange} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const inputId = useId()
  const listId = useId()
  const {type} = param
  const options = type.options && type.options.length > 0 ? type.options : undefined
  const problem = isSet ? describeProblem(type, value, t) : undefined

  let input
  if (type.kind === 'boolean' && !type.array) {
    input = (
      <BooleanInput
        disabled={disabled}
        id={inputId}
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
            kind={type.array ? 'any' : type.kind}
            listId={options && listId}
            onChange={onChange}
            placeholder={
              type.kind === 'any' || type.array
                ? t('vista.params-form.any-placeholder')
                : t('vista.params-form.not-set')
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
            text={t('vista.params-form.now')}
          />
        )}
      </Flex>
    )
  }

  return (
    <Stack data-testid={`vista-params-form-${param.name}`} gap={2}>
      <Flex alignItems="center" flexWrap="wrap" gap={2}>
        <Text as="label" htmlFor={inputId} size={1} weight="medium">
          <code>{`$${param.name}`}</code>
        </Text>
        <Text data-testid={`vista-params-form-${param.name}-type`} muted size={1}>
          {describeType(type, t)}
        </Text>
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
          data-testid={`vista-params-form-${param.name}-problem`}
          padding={2}
          radius={2}
          tone="caution"
        >
          <Text size={1}>{problem}</Text>
        </Card>
      )}
      {!isSet && (
        <Text muted size={1}>
          {t('vista.params-form.missing')}
        </Text>
      )}
      {param.usages.length > 0 && (
        <Text muted size={0}>
          {t('vista.params-form.used-in')}{' '}
          {param.usages.map((usage, index) => (
            <span key={usage}>
              {index > 0 && ', '}
              <code>{usage}</code>
            </span>
          ))}
        </Text>
      )}
    </Stack>
  )
}

/**
 * Experimental: a form for the params a query uses, inferred from the query (and the workspace
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

  return (
    <Stack data-testid="vista-params-form" gap={4} padding={3}>
      {disabled && (
        <Card padding={3} radius={2} tone="caution">
          <Text size={1}>{t('vista.params-form.invalid-json')}</Text>
        </Card>
      )}
      {inference.syntaxError && (
        <Text muted size={1}>
          {t('vista.params-form.syntax-error')}
        </Text>
      )}
      {inference.params.length === 0 && unused.length === 0 && (
        <Text muted size={1}>
          {t('vista.params-form.empty')}
        </Text>
      )}
      {inference.params.map((param) => (
        <ParamField
          disabled={disabled}
          isSet={Object.hasOwn(values, param.name)}
          key={param.name}
          onChange={(value) => setValue(param.name, value)}
          param={param}
          value={values[param.name]}
        />
      ))}
      {unused.length > 0 && (
        <Stack data-testid="vista-params-form-unused" gap={2}>
          <Text muted size={1} weight="medium">
            {t('vista.params-form.unused')}
          </Text>
          {unused.map((name) => (
            <Flex alignItems="center" gap={2} key={name}>
              <Text size={1}>
                <code>{`$${name}`}</code>
              </Text>
              <Box flexBasis="0%" flexGrow={1} minWidth="0">
                <Text muted size={1} textOverflow="ellipsis">
                  {preview(values[name])}
                </Text>
              </Box>
              <Button
                fontSize={1}
                mode="bleed"
                onClick={() => setValue(name, undefined)}
                padding={2}
                text={t('vista.params-form.remove')}
              />
            </Flex>
          ))}
        </Stack>
      )}
      {inference.params.length > 0 && inference.schemaUnavailable && (
        <Text muted size={0}>
          {t('vista.params-form.no-schema')}
        </Text>
      )}
    </Stack>
  )
}
