/**
 * The form of a document: its fields in schema order grouped into fieldsets, each with a header,
 * an input for its kind, presence and validation, like the Rust studio's `form` module.
 */
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Card, Flex, Grid, Stack, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {type CSSProperties, type ReactNode, useState} from 'react'

import {FieldCommentButton} from '../comments'
import {pathToString} from '../paths'
import {PresenceAvatars, useFieldPresence} from '../presence'
import {
  isHidden,
  isReadOnly,
  type Marker,
  type Resolved,
  schema,
  titleOf,
  type TypeDef,
  validate,
} from '../schema'
import {isObject, type Json, type JsonObject, startCase} from '../util'
import {ArrayInput} from './array'
import {AssetInput} from './asset'
import {BooleanInput, numberFrom, PrimitiveInput, SlugInput, SyncedInput} from './inputs'
import {InputContext, type InputProps} from './nested'
import {ReferenceInput} from './reference'
import {objectField, type Target, valueOf} from './target'

function markerStyle(level: string): CSSProperties {
  const tone = level === 'warning' ? 'caution' : level === 'info' ? 'primary' : 'critical'
  return {
    ['--card-fg-color' as string]: `var(--card-badge-${tone}-fg-color)`,
    ['--card-icon-color' as string]: `var(--card-badge-${tone}-icon-color)`,
  }
}

export function Markers(props: {markers: Marker[]}) {
  return props.markers.map((marker, index) => (
    <div key={index} style={markerStyle(marker.level)}>
      <Flex gap={2} align="center">
        <Text size={1}>
          {marker.level === 'error' ? <ErrorOutlineIcon /> : <WarningOutlineIcon />}
        </Text>
        <Text size={1}>{marker.message}</Text>
      </Flex>
    </div>
  ))
}

function FieldHeader(props: {title: string; description?: string}) {
  return (
    <Stack gap={2}>
      <Text size={1} weight="medium">
        {props.title}
      </Text>
      {props.description ? (
        <Text size={1} muted>
          {props.description}
        </Text>
      ) : null}
    </Stack>
  )
}

function Unsupported(props: {target: Target; typeName: string}) {
  const value = valueOf(props.target)
  let json = value === undefined ? undefined : JSON.stringify(value, null, 2)
  if (json && json.length > 600) json = `${json.slice(0, 600)}…`
  return (
    <Card border radius={2} padding={3} tone="transparent">
      <Stack gap={3}>
        <Text size={1} muted>
          Editing {props.typeName} fields isn&apos;t ported to the JS-lite studio yet.
        </Text>
        {json ? <Code size={1}>{json}</Code> : null}
      </Stack>
    </Card>
  )
}

/** The inline editor for a value of `resolved`, without the field header. */
export function Input(props: {target: Target; resolved: Resolved; level: number}) {
  const {target, resolved, level} = props
  switch (resolved.kind) {
    case 'string':
    case 'url':
    case 'email':
    case 'text':
    case 'number':
    case 'date':
    case 'datetime':
      return <PrimitiveInput target={target} resolved={resolved} />
    case 'boolean':
      return <BooleanInput target={target} resolved={resolved} />
    case 'slug':
      return <SlugInput target={target} resolved={resolved} />
    case 'reference':
      return <ReferenceInput target={target} resolved={resolved} />
    case 'array':
      return <ArrayInput target={target} resolved={resolved} level={level} />
    case 'object':
    case 'image':
    case 'file':
    case 'geopoint':
    case 'document':
      return <ObjectInput target={target} resolved={resolved} level={level} />
    case 'block':
      return (
        <Text size={1} muted>
          Blocks are edited inside a Portable Text input.
        </Text>
      )
    case 'crossDatasetReference':
    case 'unknown':
      return <Unsupported target={target} typeName={resolved.typeName} />
    default: {
      const exhaustive: never = resolved.kind
      return exhaustive
    }
  }
}

/** One field of an object: header, input and validation. */
function Field(props: {parent: Target; objectType: string; field: TypeDef; level: number}) {
  const {parent, objectType, field, level} = props
  const resolved = schema().resolve(field)
  const base = objectField(parent, objectType, field.name)
  const target = isReadOnly(field) ? {...base, readOnly: true} : base
  const nested =
    resolved.kind === 'object' ||
    resolved.kind === 'image' ||
    resolved.kind === 'file' ||
    resolved.kind === 'geopoint'
  const present = useFieldPresence(target.published, target.path, nested)
  const markers = validate(resolved, valueOf(target))
  const path = pathToString(target.path)
  const title = titleOf(field)
  const description = field.description || undefined

  if (resolved.kind === 'boolean') {
    return (
      <div data-testid={`field-${path}`} data-path={path}>
        <Stack gap={3}>
          <Flex gap={3} align="flex-start">
            <div style={{flex: 'none'}}>
              <BooleanInput target={target} resolved={resolved} />
            </div>
            <Box flex={1}>
              <FieldHeader title={title} description={description} />
            </Box>
            <PresenceAvatars present={present} />
            <FieldCommentButton path={path} />
          </Flex>
          <Markers markers={markers} />
        </Stack>
      </div>
    )
  }
  return (
    <div data-testid={`field-${path}`} data-path={path}>
      <Stack gap={3}>
        <Flex gap={2} align="flex-end">
          <Box flex={1}>
            <FieldHeader title={title} description={description} />
          </Box>
          <PresenceAvatars present={present} />
          {nested ? null : <FieldCommentButton path={path} />}
        </Flex>
        <Input target={target} resolved={resolved} level={level + (nested ? 1 : 0)} />
        <Markers markers={markers} />
      </Stack>
    </div>
  )
}

function optionBool(options: JsonObject | undefined, key: string): boolean {
  return options?.[key] === true
}

function Disclosure(props: {open: boolean; onToggle: () => void; children: ReactNode}) {
  return (
    <button
      type="button"
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
      }}
      onClick={props.onToggle}
    >
      <Text size={1} muted>
        {props.open ? <ChevronDownIcon /> : <ChevronRightIcon />}
      </Text>
      {props.children}
    </button>
  )
}

const NESTED_BOX: CSSProperties = {borderLeft: '1px solid var(--card-border-color)'}

function Fieldset(props: {
  title: string
  collapsible: boolean
  collapsed: boolean
  columns: number | undefined
  children: ReactNode
}) {
  const [open, setOpen] = useState(!props.collapsed)
  const title = (
    <Text size={1} weight="semibold">
      {props.title}
    </Text>
  )
  return (
    <Stack gap={3}>
      {props.collapsible ? (
        <Disclosure open={open} onToggle={() => setOpen(!open)}>
          {title}
        </Disclosure>
      ) : (
        title
      )}
      {open ? (
        <Box paddingTop={1} paddingBottom={1} paddingLeft={3} style={NESTED_BOX}>
          {props.columns ? (
            <Grid gridTemplateColumns={props.columns} gap={4}>
              {props.children}
            </Grid>
          ) : (
            <Stack gap={5}>{props.children}</Stack>
          )}
        </Box>
      ) : null}
    </Stack>
  )
}

function renderInput(props: InputProps) {
  return <Input {...props} />
}

/** The fields of an object in schema order; fields that share a fieldset render together, at
 * the position of the first of them. */
export function Fields(props: {
  target: Target
  objectType: string
  fields: TypeDef[]
  fieldsets: Resolved['fieldsets']
  level: number
}) {
  const {target, objectType, fields, fieldsets, level} = props
  const rendered = new Set<string>()
  const views: ReactNode[] = []
  for (const field of fields) {
    const fieldset = field.fieldset
      ? fieldsets.find((candidate) => candidate.name === field.fieldset)
      : undefined
    if (!fieldset) {
      if (!isHidden(field)) {
        views.push(
          <Field
            key={field.name}
            parent={target}
            objectType={objectType}
            field={field}
            level={level}
          />,
        )
      }
      continue
    }
    if (rendered.has(fieldset.name)) continue
    rendered.add(fieldset.name)
    const members = fields.filter((candidate) => candidate.fieldset === fieldset.name)
    if (members.every(isHidden)) continue
    const columns = fieldset.options?.columns
    views.push(
      <Fieldset
        key={`fieldset-${fieldset.name}`}
        title={fieldset.title || startCase(fieldset.name)}
        collapsible={
          optionBool(fieldset.options, 'collapsible') || optionBool(fieldset.options, 'collapsed')
        }
        collapsed={optionBool(fieldset.options, 'collapsed')}
        columns={typeof columns === 'number' ? columns : undefined}
      >
        {members
          .filter((member) => !isHidden(member))
          .map((member) => (
            <Field
              key={member.name}
              parent={target}
              objectType={objectType}
              field={member}
              level={level}
            />
          ))}
      </Fieldset>,
    )
  }
  return (
    <InputContext value={renderInput}>
      <Stack gap={5}>{views}</Stack>
    </InputContext>
  )
}

function numberText(value: unknown): string {
  return typeof value === 'number' ? String(value) : ''
}

function GeopointInput(props: {target: Target}) {
  const lat = objectField(props.target, 'geopoint', 'lat')
  const lng = objectField(props.target, 'geopoint', 'lng')
  return (
    <Grid gridTemplateColumns={2} gap={3}>
      <Stack gap={2}>
        <Text size={1} muted>
          Latitude
        </Text>
        <SyncedInput target={lat} toText={numberText} fromText={numberFrom} type="number" />
      </Stack>
      <Stack gap={2}>
        <Text size={1} muted>
          Longitude
        </Text>
        <SyncedInput target={lng} toText={numberText} fromText={numberFrom} type="number" />
      </Stack>
    </Grid>
  )
}

function ObjectInput(props: {target: Target; resolved: Resolved; level: number}) {
  const {target, resolved, level} = props
  const options = resolved.options
  const [open, setOpen] = useState(!optionBool(options, 'collapsed'))
  if (resolved.kind === 'geopoint') return <GeopointInput target={target} />
  const asset = resolved.kind === 'image' || resolved.kind === 'file'
  const fields = asset ? resolved.fields.filter((field) => field.name !== 'asset') : resolved.fields
  const collapsible = optionBool(options, 'collapsible') || optionBool(options, 'collapsed')
  return (
    <Stack gap={4}>
      {asset ? (
        <AssetInput
          target={target}
          kind={resolved.kind === 'image' ? 'image' : 'file'}
          typeName={resolved.typeName}
          options={options}
        />
      ) : null}
      {collapsible ? (
        <Disclosure open={open} onToggle={() => setOpen(!open)}>
          <Text size={1} muted>
            {open ? 'Hide fields' : 'Show fields'}
          </Text>
        </Disclosure>
      ) : null}
      {open && fields.length > 0 ? (
        <Box paddingTop={1} paddingBottom={1} paddingLeft={3} style={NESTED_BOX}>
          <Fields
            target={target}
            objectType={resolved.typeName}
            fields={fields}
            fieldsets={resolved.fieldsets}
            level={level}
          />
        </Box>
      ) : null}
    </Stack>
  )
}

/**
 * The references that are strong once the document is published, by the title of the top-level
 * field they are in: references to documents that aren't published are weak with
 * `_strengthenOnPublish` until then, and the Content Lake rejects publishing a strong reference
 * to a document that doesn't exist.
 */
export function referencesToPublish(typeName: string, doc: JsonObject): [string, string][] {
  const out: [string, string][] = []
  const collect = (value: Json | undefined, title: string) => {
    if (Array.isArray(value)) {
      for (const item of value) collect(item, title)
      return
    }
    if (!isObject(value)) return
    const local = !('_dataset' in value) && !('_projectId' in value)
    const ref = value._ref
    if (typeof ref === 'string' && local && !ref.includes(':')) {
      const weak = value._weak === true
      const strengthen = value._strengthenOnPublish
      const staysWeak =
        strengthen === undefined || (isObject(strengthen) && strengthen.weak === true)
      if (!(weak && staysWeak)) out.push([title, ref])
      return
    }
    for (const entry of Object.values(value)) collect(entry, title)
  }
  for (const field of schema().get(typeName)?.fields ?? []) {
    collect(doc[field.name], titleOf(field))
  }
  return out
}

/** Validation markers of the top-level fields of a document, for the footer. */
export function documentMarkers(typeName: string, doc: JsonObject | null | undefined): Marker[] {
  const current = schema()
  return (current.get(typeName)?.fields ?? [])
    .filter((field) => !isHidden(field))
    .flatMap((field) =>
      validate(current.resolve(field), doc?.[field.name]).map((marker) => ({
        ...marker,
        message: `${titleOf(field)}: ${marker.message}`,
      })),
    )
}
