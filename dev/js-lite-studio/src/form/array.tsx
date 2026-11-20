/**
 * Arrays: checkboxes for primitive `options.list` arrays, rows of inputs for other primitive
 * arrays, and item cards that expand to edit for arrays of objects and references, reordered by
 * drag and drop or the item menu.
 */
import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'
import {CopyIcon} from '@sanity/icons/Copy'
import {DragHandleIcon} from '@sanity/icons/DragHandle'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Button, Card, Checkbox, Flex, Grid, Skeleton, Stack, Text} from '@sanity/ui'
import {Menu, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {Popover} from '@sanity/ui/popover'
import {type DragEvent, type ReactNode, useRef, useState} from 'react'

import {MediaBox, PreviewContent} from '../DocumentList'
import {usePreview} from '../previews'
import {listOptions, memberTypeName, type Resolved, schema, titleOf} from '../schema'
import {useDismiss} from '../ui'
import {isObject, type Json, type JsonObject, previewText, randomKey} from '../util'
import {asText, numberFrom, SyncedInput} from './inputs'
import {useRenderInput} from './nested'
import {PortableTextInput} from './pte'
import {child, op, patch, setValue, type Target, unsetValue, valueOf} from './target'

interface Member {
  typeName: string
  title: string
  resolved: Resolved
}

function membersOf(resolved: Resolved): Member[] {
  const current = schema()
  return resolved.of.map((member) => {
    const typeName = memberTypeName(member)
    return {
      typeName,
      title: member.title || member.name ? titleOf(member) : current.typeTitle(typeName),
      resolved: current.resolve(member),
    }
  })
}

function memberFor(members: Member[], typeName: string): Member | undefined {
  return (
    members.find((member) => member.typeName === typeName) ??
    (members.length === 1 ? members[0] : undefined)
  )
}

const PRIMITIVE = new Set([
  'string',
  'text',
  'number',
  'boolean',
  'url',
  'email',
  'date',
  'datetime',
])

export function ArrayInput(props: {target: Target; resolved: Resolved; level: number}) {
  const {target, resolved, level} = props
  const members = membersOf(resolved)
  if (members.some((member) => member.resolved.kind === 'block')) {
    return <PortableTextInput target={target} resolved={resolved} level={level} />
  }
  if (members.length > 0 && members.every((member) => PRIMITIVE.has(member.resolved.kind))) {
    const list = listOptions(resolved)
    if (list) return <TagsInput target={target} list={list} />
    return <PrimitiveArray target={target} number={members[0].resolved.kind === 'number'} />
  }
  return <ObjectArray target={target} members={members} level={level} />
}

function items(target: Target): Json[] {
  const value = valueOf(target)
  return Array.isArray(value) ? (value as Json[]) : []
}

/** A primitive array with `options.list`: one checkbox per option, in list order. */
function TagsInput(props: {target: Target; list: [Json, string][]}) {
  const {target, list} = props
  const current = items(target)
  const has = (value: Json) =>
    current.some((item) => JSON.stringify(item) === JSON.stringify(value))
  const toggle = (value: Json, on: boolean) => {
    const next = list
      .map(([candidate]) => candidate)
      .filter((candidate) =>
        JSON.stringify(candidate) === JSON.stringify(value) ? on : has(candidate),
      )
    if (next.length === 0) unsetValue(target)
    else setValue(target, next)
  }
  return (
    <Grid gridTemplateColumns={2} gap={3}>
      {list.map(([value, title]) => (
        <Flex key={JSON.stringify(value)} gap={2} align="center">
          <Checkbox
            checked={has(value)}
            readOnly={target.readOnly}
            onChange={(event) => toggle(value, event.currentTarget.checked)}
          />
          <Text size={1}>{title}</Text>
        </Flex>
      ))}
    </Grid>
  )
}

function stringItem(text: string) {
  return {type: 'set' as const, value: text}
}

function append(target: Target, item: Json) {
  patch(target, [
    op.setIfMissing(target.path, []),
    op.insert('after', [...target.path, -1], [item]),
  ])
}

/** Strings and numbers by index, the way the JS studio edits arrays of primitives. */
function PrimitiveArray(props: {target: Target; number: boolean}) {
  const {target, number} = props
  const length = items(target).length
  return (
    <Stack gap={2}>
      {Array.from({length}, (_, index) => {
        const item = child(target, index)
        return (
          <Flex key={index} gap={1} align="center">
            <Box flex={1}>
              {number ? (
                <SyncedInput target={item} toText={asText} fromText={numberFrom} type="number" />
              ) : (
                <SyncedInput target={item} toText={asText} fromText={stringItem} />
              )}
            </Box>
            <Button
              mode="bleed"
              icon={TrashIcon}
              tone="critical"
              title="Remove"
              disabled={target.readOnly}
              onClick={() => unsetValue(item)}
            />
          </Flex>
        )
      })}
      <Button
        mode="ghost"
        icon={AddIcon}
        text="Add item"
        disabled={target.readOnly}
        onClick={() => append(target, number ? 0 : '')}
      />
    </Stack>
  )
}

/** The title, subtitle and media of an object item from its fields, like the JS studio's
 * guessed preview. */
function objectPreview(item: JsonObject, member: Member | undefined): [string, string?, string?] {
  const typeTitle = member?.title ?? 'Item'
  if (!member) return [typeTitle]
  const assetRef = (value: Json | undefined) => {
    const asset = isObject(value) ? value.asset : undefined
    return isObject(asset) && typeof asset._ref === 'string' ? asset._ref : undefined
  }
  if (member.resolved.kind === 'image' || member.resolved.kind === 'file') {
    const title = ['caption', 'alt', 'title'].map((field) => previewText(item[field])).find(Boolean)
    return [
      title ?? typeTitle,
      undefined,
      member.resolved.kind === 'image' ? assetRef(item) : undefined,
    ]
  }
  const guess = schema().guessFieldsPreview(member.resolved.fields)
  const title = (guess.title && previewText(item[guess.title])) || typeTitle
  const subtitle = guess.subtitle ? previewText(item[guess.subtitle]) : undefined
  const media = guess.media ? assetRef(item[guess.media]) : undefined
  return [title, subtitle, media]
}

function ReferenceSummary(props: {id: string}) {
  const state = usePreview(props.id)
  switch (state.type) {
    case 'loading':
      return (
        <Flex align="center" gap={2}>
          <Skeleton style={{width: 33, height: 33}} radius={1} animated />
          <Skeleton style={{width: '40%', height: '0.8125rem'}} animated />
        </Flex>
      )
    case 'missing':
      return (
        <Text size={1} muted>
          Document not found
        </Text>
      )
    case 'failed':
      return (
        <Text size={1} muted>
          Could not load the preview
        </Text>
      )
    case 'ready':
      return <PreviewContent preview={state.preview} />
    default: {
      const exhaustive: never = state
      return exhaustive
    }
  }
}

function ItemSummary(props: {item: Json | undefined; member: Member | undefined}) {
  const {item, member} = props
  if (!isObject(item)) return null
  if (member?.resolved.kind === 'reference') {
    if (typeof item._ref !== 'string') {
      return (
        <Box padding={2}>
          <Text size={1} muted>
            Empty reference
          </Text>
        </Box>
      )
    }
    return <ReferenceSummary id={item._ref} />
  }
  const [title, subtitle, media] = objectPreview(item, member)
  return (
    <Flex align="center" gap={2}>
      <MediaBox media={media} size={33} />
      <Stack gap={2} flex={1}>
        <Text size={1} weight="medium" textOverflow="ellipsis">
          {title}
        </Text>
        {subtitle ? (
          <Text size={1} muted textOverflow="ellipsis">
            {subtitle}
          </Text>
        ) : null}
      </Stack>
    </Flex>
  )
}

interface Drag {
  dragging: string | undefined
  /** The item the dragged one would land next to, and whether before it. */
  over: [string, boolean] | undefined
}

function keysOf(target: Target): string[] {
  return items(target).flatMap((item) =>
    isObject(item) && typeof item._key === 'string' ? [item._key] : [],
  )
}

/** Moves the item with `key` next to the item with `anchor`. */
function moveItem(target: Target, key: string, anchor: string, before: boolean) {
  if (key === anchor) return
  const item = valueOf(child(target, {_key: key}))
  if (item === undefined) return
  patch(target, [
    op.unset([...target.path, {_key: key}]),
    op.insert(before ? 'before' : 'after', [...target.path, {_key: anchor}], [item as Json]),
  ])
}

function ItemMenu(props: {readOnly: boolean; onAction: (action: string) => void}) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  useDismiss(
    open,
    () => setOpen(false),
    () => [button.current, popover.current],
  )
  const run = (action: string) => {
    setOpen(false)
    props.onAction(action)
  }
  return (
    <Popover
      ref={popover}
      open={open}
      placement="bottom-end"
      portal
      content={
        <Menu>
          <MenuItem
            text="Move up"
            icon={ChevronUpIcon}
            disabled={props.readOnly}
            onClick={() => run('up')}
          />
          <MenuItem
            text="Move down"
            icon={ChevronDownIcon}
            disabled={props.readOnly}
            onClick={() => run('down')}
          />
          <MenuItem
            text="Duplicate"
            icon={CopyIcon}
            disabled={props.readOnly}
            onClick={() => run('duplicate')}
          />
          <MenuDivider />
          <MenuItem
            text="Remove"
            icon={TrashIcon}
            tone="critical"
            disabled={props.readOnly}
            onClick={() => run('remove')}
          />
        </Menu>
      }
    >
      <Button
        ref={button}
        mode="bleed"
        icon={EllipsisHorizontalIcon}
        title="Show more"
        onClick={() => setOpen(!open)}
      />
    </Popover>
  )
}

function ArrayItem(props: {
  target: Target
  itemKey: string
  typeName: string
  members: Member[]
  level: number
  drag: Drag
  setDrag: (drag: Drag) => void
  autoOpen: boolean
}) {
  const {target, itemKey, typeName, members, level, drag, setDrag} = props
  const renderInput = useRenderInput()
  const item = child(target, {_key: itemKey})
  const member = memberFor(members, typeName)
  const [open, setOpen] = useState(props.autoOpen)
  const readOnly = target.readOnly

  const indicator =
    drag.over &&
    drag.over[0] === itemKey &&
    drag.dragging !== undefined &&
    drag.dragging !== itemKey
      ? drag.over[1]
        ? 'inset 0 2px 0 var(--card-focus-ring-color)'
        : 'inset 0 -2px 0 var(--card-focus-ring-color)'
      : undefined

  const onDragStart = (event: DragEvent<HTMLSpanElement>) => {
    if (readOnly) {
      event.preventDefault()
      return
    }
    event.dataTransfer.setData('text/plain', itemKey)
    event.dataTransfer.effectAllowed = 'move'
    const row = event.currentTarget.closest('[data-array-item]')
    if (row) event.dataTransfer.setDragImage(row, 16, 16)
    setDrag({dragging: itemKey, over: undefined})
  }
  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (drag.dragging === undefined) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const before = event.clientY < rect.top + rect.height / 2
    if (drag.over?.[0] !== itemKey || drag.over[1] !== before)
      setDrag({...drag, over: [itemKey, before]})
  }
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (drag.dragging !== undefined && drag.over)
      moveItem(target, drag.dragging, drag.over[0], drag.over[1])
    setDrag({dragging: undefined, over: undefined})
  }
  const step = (delta: number) => {
    const keys = keysOf(target)
    const index = keys.indexOf(itemKey)
    const next = index + delta
    if (index < 0 || next < 0 || next >= keys.length) return
    moveItem(target, itemKey, keys[next], delta < 0)
  }
  const onAction = (action: string) => {
    switch (action) {
      case 'remove':
        unsetValue(item)
        break
      case 'duplicate': {
        const value = valueOf(item)
        if (isObject(value)) {
          patch(target, [
            op.insert(
              'after',
              [...target.path, {_key: itemKey}],
              [{...value, _key: randomKey(12)}],
            ),
          ])
        }
        break
      }
      case 'up':
        step(-1)
        break
      case 'down':
        step(1)
        break
      default:
    }
  }

  let editor: ReactNode
  if (member) {
    editor = renderInput({target: item, resolved: member.resolved, level: level + 1})
  } else {
    editor = (
      <Text size={1} muted>
        The schema has no array member of type {JSON.stringify(typeName)}.
      </Text>
    )
  }

  return (
    <div data-array-item="" style={{boxShadow: indicator}} onDragOver={onDragOver} onDrop={onDrop}>
      <Card border radius={2} padding={1}>
        <Flex align="center" gap={1}>
          <span
            draggable
            title="Drag to reorder"
            style={{
              cursor: 'grab',
              display: 'flex',
              padding: '0.5rem 0.25rem',
              color: 'var(--card-muted-fg-color)',
            }}
            onDragStart={onDragStart}
            onDragEnd={() => setDrag({dragging: undefined, over: undefined})}
          >
            <Text size={1} muted>
              <DragHandleIcon />
            </Text>
          </span>
          <button
            type="button"
            style={{
              all: 'unset',
              flex: 1,
              minWidth: 0,
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.1875rem',
            }}
            onClick={() => setOpen(!open)}
          >
            <ItemSummary item={valueOf(item) as Json | undefined} member={member} />
          </button>
          <Button
            mode="bleed"
            icon={open ? ChevronUpIcon : ChevronDownIcon}
            title={open ? 'Collapse' : 'Edit'}
            onClick={() => setOpen(!open)}
          />
          <ItemMenu readOnly={readOnly} onAction={onAction} />
        </Flex>
        {open ? (
          <Box paddingTop={3} paddingRight={2} paddingBottom={2} paddingLeft={2}>
            {editor}
          </Box>
        ) : null}
      </Card>
    </div>
  )
}

function AddItemButton(props: {
  members: Member[]
  readOnly: boolean
  onAdd: (typeName: string) => void
}) {
  const {members, readOnly, onAdd} = props
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  useDismiss(
    open,
    () => setOpen(false),
    () => [button.current, popover.current],
  )
  if (members.length === 1) {
    return (
      <Button
        mode="ghost"
        icon={AddIcon}
        text="Add item"
        disabled={readOnly}
        style={{width: '100%'}}
        justify="center"
        onClick={() => onAdd(members[0].typeName)}
      />
    )
  }
  return (
    <Popover
      ref={popover}
      open={open}
      portal
      matchReferenceWidth
      content={
        <Menu>
          {members.map((member) => (
            <MenuItem
              key={member.typeName}
              text={member.title}
              onClick={() => {
                setOpen(false)
                onAdd(member.typeName)
              }}
            />
          ))}
        </Menu>
      }
    >
      <Button
        ref={button}
        mode="ghost"
        icon={AddIcon}
        iconRight={ChevronDownIcon}
        text="Add item…"
        disabled={readOnly}
        style={{width: '100%'}}
        justify="center"
        onClick={() => setOpen(!open)}
      />
    </Popover>
  )
}

function ObjectArray(props: {target: Target; members: Member[]; level: number}) {
  const {target, members, level} = props
  const [drag, setDrag] = useState<Drag>({dragging: undefined, over: undefined})
  const [justAdded, setJustAdded] = useState<string>()
  const list = items(target)
  const rows = list.flatMap((item) =>
    isObject(item) && typeof item._key === 'string'
      ? [[item._key, typeof item._type === 'string' ? item._type : ''] as const]
      : [],
  )
  const missingKeys = list.length - rows.length
  const add = (typeName: string) => {
    const key = randomKey(12)
    setJustAdded(key)
    append(target, {_key: key, _type: typeName})
  }
  const addMissingKeys = () => {
    setValue(
      target,
      list.map((item) =>
        isObject(item) && item._key === undefined ? {...item, _key: randomKey(12)} : item,
      ),
    )
  }
  return (
    <Stack gap={2}>
      {missingKeys > 0 ? (
        <Card tone="caution" border radius={2} padding={3}>
          <Flex align="center" gap={2}>
            <Box flex={1}>
              <Text size={1}>
                Some items are missing their _key, so they can&apos;t be edited one by one.
              </Text>
            </Box>
            <Button
              mode="ghost"
              text="Add missing keys"
              disabled={target.readOnly}
              onClick={addMissingKeys}
            />
          </Flex>
        </Card>
      ) : null}
      {rows.map(([key, typeName]) => (
        <ArrayItem
          key={`${key}:${typeName}`}
          target={target}
          itemKey={key}
          typeName={typeName}
          members={members}
          level={level}
          drag={drag}
          setDrag={setDrag}
          autoOpen={justAdded === key}
        />
      ))}
      <AddItemButton members={members} readOnly={target.readOnly} onAdd={add} />
    </Stack>
  )
}
