/** Inputs for primitive values: string, text, number, url, email, date, datetime, boolean and
 * slug, plus `options.list` selects and radios. */
import {DIFF_DELETE, DIFF_EQUAL, makeDiff} from '@sanity/diff-match-patch'
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Select,
  Stack,
  Switch,
  Text,
  TextArea,
  TextInput,
} from '@sanity/ui'
import {useId, useLayoutEffect, useRef, useState} from 'react'

import {getAt, parsePath} from '../paths'
import {listOptions, type Resolved} from '../schema'
import {type Json, previewText} from '../util'
import {setValue, type Target, unsetValue, valueOf} from './target'

/** What typing a text means for the value: a value, removing it, or nothing yet (eg `-` in a
 * number input), which leaves the document alone. */
type Parsed = {type: 'set'; value: Json} | {type: 'unset'} | {type: 'ignore'}

export function asText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

function stringFrom(text: string): Parsed {
  return text ? {type: 'set', value: text} : {type: 'unset'}
}

export function numberFrom(text: string): Parsed {
  const trimmed = text.trim()
  if (!trimmed) return {type: 'unset'}
  const number = Number(trimmed)
  return Number.isFinite(number) ? {type: 'set', value: number} : {type: 'ignore'}
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** `2024-05-01T13:37:00.000Z` as `2024-05-01T15:37` in the browser's timezone, the format of
 * `<input type="datetime-local">`. */
function datetimeToLocal(value: unknown): string {
  if (typeof value !== 'string') return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function datetimeFrom(text: string): Parsed {
  if (!text) return {type: 'unset'}
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? {type: 'ignore'} : {type: 'set', value: date.toISOString()}
}

function slugText(value: unknown): string {
  const current = (value as {current?: unknown} | undefined)?.current
  return typeof current === 'string' ? current : ''
}

function slugFrom(text: string): Parsed {
  return text ? {type: 'set', value: {_type: 'slug', current: text}} : {type: 'unset'}
}

/** The default `slugify` of the slug input: lowercase, words joined by `-`, at most 200
 * characters. */
export function slugify(source: string): string {
  let slug = ''
  for (const char of source.toLowerCase()) {
    if (/[\p{L}\p{N}]/u.test(char)) slug += char
    else if (slug && !slug.endsWith('-')) slug += '-'
  }
  return [...slug.replace(/-+$/, '')].slice(0, 200).join('')
}

/**
 * Where a caret in `old` ends up in `next`: text inserted before it pushes it along, text inserted
 * at it lands after it, and a deletion around it collapses it to where the deletion was.
 */
export function mapCaret(old: string, next: string, caret: number): number {
  let oldAt = 0
  let nextAt = 0
  for (const [operation, text] of makeDiff(old, next)) {
    if (operation === DIFF_EQUAL) {
      if (oldAt + text.length >= caret) return nextAt + (caret - oldAt)
      oldAt += text.length
      nextAt += text.length
    } else if (operation === DIFF_DELETE) {
      if (oldAt + text.length >= caret) return nextAt
      oldAt += text.length
    } else {
      if (oldAt >= caret) return nextAt
      nextAt += text.length
    }
  }
  return nextAt
}

/**
 * A text input over a value. The displayed text only follows the document when the document
 * changes to something other than what this input last wrote, so the cursor and partially typed
 * values (`1.`, half a date) survive the optimistic update and the listener echo, and a remote
 * edit moves the cursor along with the text around it.
 */
export function SyncedInput(props: {
  target: Target
  toText: (value: unknown) => string
  fromText: (text: string) => Parsed
  type?: string
  rows?: number
  placeholder?: string
}) {
  const {target, toText, fromText} = props
  const remote = valueOf(target)
  const remoteKey = JSON.stringify(remote) ?? ''
  const emitted = useRef(remoteKey)
  const [display, setDisplay] = useState(() => toText(remote))
  const element = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    if (emitted.current === remoteKey) return
    emitted.current = remoteKey
    const text = toText(remote)
    const field = element.current
    if (field && document.activeElement === field && field.selectionStart !== null) {
      const shown = field.value
      const start = mapCaret(shown, text, field.selectionStart)
      const end = mapCaret(shown, text, field.selectionEnd ?? field.selectionStart)
      field.value = text
      field.setSelectionRange(start, end)
    }
    setDisplay(text)
  }, [remoteKey, remote, toText])

  const onChange = (text: string) => {
    setDisplay(text)
    const parsed = fromText(text)
    switch (parsed.type) {
      case 'set':
        emitted.current = JSON.stringify(parsed.value)
        setValue(target, parsed.value)
        break
      case 'unset':
        emitted.current = ''
        unsetValue(target)
        break
      case 'ignore':
        break
      default: {
        const exhaustive: never = parsed
        return exhaustive
      }
    }
  }

  if (props.rows !== undefined) {
    return (
      <TextArea
        ref={element}
        value={display}
        rows={props.rows}
        readOnly={target.readOnly}
        placeholder={props.placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    )
  }
  return (
    <TextInput
      ref={element}
      value={display}
      type={(props.type ?? 'text') as never}
      step={props.type === 'number' ? 'any' : undefined}
      readOnly={target.readOnly}
      placeholder={props.placeholder}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  )
}

function listValueKey(value: Json): string {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

/** `options.list` as a select, or as radios with `options.layout: 'radio'`. */
function ListInput(props: {target: Target; list: [Json, string][]; radio: boolean}) {
  const {target, list, radio} = props
  const name = useId()
  const value = valueOf(target)
  const current = value === undefined ? '' : listValueKey(value as Json)
  const choose = (key: string) => {
    const found = list.find(([candidate]) => listValueKey(candidate) === key)
    if (found) setValue(target, found[0])
    else unsetValue(target)
  }
  if (radio) {
    return (
      <Stack gap={3}>
        {list.map(([item, title]) => {
          const key = listValueKey(item)
          return (
            <label key={key} style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
              <input
                type="radio"
                name={name}
                checked={current === key}
                disabled={target.readOnly}
                onChange={() => choose(key)}
              />
              <Text size={1}>{title}</Text>
            </label>
          )
        })}
      </Stack>
    )
  }
  return (
    <Select
      value={current}
      readOnly={target.readOnly}
      onChange={(event) => choose(event.currentTarget.value)}
    >
      <option value="">Select…</option>
      {list.map(([item, title]) => (
        <option key={listValueKey(item)} value={listValueKey(item)}>
          {title}
        </option>
      ))}
    </Select>
  )
}

export function PrimitiveInput(props: {target: Target; resolved: Resolved}) {
  const {target, resolved} = props
  const list = listOptions(resolved)
  if (list)
    return <ListInput target={target} list={list} radio={resolved.options?.layout === 'radio'} />
  const placeholder = resolved.def.placeholder
  switch (resolved.kind) {
    case 'text':
      return (
        <SyncedInput
          target={target}
          toText={asText}
          fromText={stringFrom}
          rows={resolved.def.rows ?? 10}
          placeholder={placeholder}
        />
      )
    case 'number':
      return (
        <SyncedInput
          target={target}
          toText={asText}
          fromText={numberFrom}
          type="number"
          placeholder={placeholder}
        />
      )
    case 'date':
      return <SyncedInput target={target} toText={asText} fromText={stringFrom} type="date" />
    case 'datetime':
      return (
        <SyncedInput
          target={target}
          toText={datetimeToLocal}
          fromText={datetimeFrom}
          type="datetime-local"
        />
      )
    case 'url':
      return (
        <SyncedInput
          target={target}
          toText={asText}
          fromText={stringFrom}
          type="url"
          placeholder={placeholder}
        />
      )
    case 'email':
      return (
        <SyncedInput
          target={target}
          toText={asText}
          fromText={stringFrom}
          type="email"
          placeholder={placeholder}
        />
      )
    default:
      return (
        <SyncedInput
          target={target}
          toText={asText}
          fromText={stringFrom}
          placeholder={placeholder}
        />
      )
  }
}

export function BooleanInput(props: {target: Target; resolved: Resolved}) {
  const {target, resolved} = props
  const value = valueOf(target)
  const checked = typeof value === 'boolean' ? value : undefined
  const onChange = (event: {currentTarget: HTMLInputElement}) =>
    setValue(target, event.currentTarget.checked)
  if (resolved.options?.layout === 'checkbox') {
    return (
      <Checkbox
        checked={checked ?? false}
        indeterminate={checked === undefined}
        readOnly={target.readOnly}
        onChange={onChange}
      />
    )
  }
  return (
    <Switch
      checked={checked ?? false}
      indeterminate={checked === undefined}
      readOnly={target.readOnly}
      onChange={onChange}
    />
  )
}

export function SlugInput(props: {target: Target; resolved: Resolved}) {
  const {target, resolved} = props
  const source = typeof resolved.options?.source === 'string' ? resolved.options.source : undefined
  const generate = () => {
    if (!source) return
    let sourcePath
    try {
      sourcePath = parsePath(source)
    } catch {
      return
    }
    const text = previewText(getAt(target.doc, sourcePath))
    const slug = text ? slugify(text) : ''
    if (slug) setValue(target, {_type: 'slug', current: slug})
  }
  return (
    <Flex gap={1}>
      <Box flex={1}>
        <SyncedInput target={target} toText={slugText} fromText={slugFrom} />
      </Box>
      {source ? (
        <Button mode="ghost" text="Generate" disabled={target.readOnly} onClick={generate} />
      ) : null}
    </Flex>
  )
}
