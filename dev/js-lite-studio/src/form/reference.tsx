/** The reference input: the referenced document's preview, and a search over the allowed types to
 * pick a different one. */
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {SearchIcon} from '@sanity/icons/Search'
import {SyncIcon} from '@sanity/icons/Sync'
import {TrashIcon} from '@sanity/icons/Trash'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Button, Card, Flex, Skeleton, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {Menu, MenuItem} from '@sanity/ui/menu'
import {Popover} from '@sanity/ui/popover'
import {useEffect, useRef, useState} from 'react'

import {errorMessage} from '../client'
import {PreviewContent} from '../DocumentList'
import {type DocPreview, existingIds, search, usePreview} from '../previews'
import {linkClick, routeHref} from '../router'
import {type Resolved, schema} from '../schema'
import {useDismiss} from '../ui'
import {isObject, type JsonObject, sleep} from '../util'
import {child, op, patch, setValue, type Target, unsetValue, valueOf} from './target'

/** Points the reference at `chosen`. A document that has never been published is referenced
 * weakly and strengthened when it is published, like `_strengthenOnPublish` in the JS studio. */
async function choose(target: Target, resolved: Resolved, chosen: DocPreview) {
  const weak = resolved.options?.weak === true
  const published = (await existingIds([chosen.id]).catch(() => new Set<string>())).has(chosen.id)
  const fields: JsonObject = {_ref: chosen.id}
  if (weak || !published) fields._weak = true
  if (!published)
    fields._strengthenOnPublish = weak
      ? {type: chosen.typeName, weak: true}
      : {type: chosen.typeName}
  if (isObject(valueOf(target))) {
    // Inside arrays the item carries `_key` and `_type`, so only its reference fields change.
    patch(target, [
      ...['_weak', '_strengthenOnPublish']
        .filter((key) => !(key in fields))
        .map((key) => op.unset(child(target, key).path)),
      ...Object.entries(fields).map(([key, value]) => op.set(child(target, key).path, value)),
    ])
  } else {
    setValue(target, {_type: 'reference', ...fields})
  }
}

function ReferenceSearch(props: {
  target: Target
  resolved: Resolved
  onDone: () => void
  autoFocus: boolean
}) {
  const {target, resolved, onDone} = props
  const [text, setText] = useState('')
  const [results, setResults] = useState<{ok: DocPreview[]} | {error: string} | undefined>()
  const [open, setOpen] = useState(false)
  const generation = useRef(0)
  const wrapper = useRef<HTMLDivElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  useDismiss(
    open,
    () => setOpen(false),
    () => [wrapper.current, popover.current],
  )
  const types = resolved.to
  const placeholder = `Search ${types.map((name) => schema().typeTitle(name)).join(', ')}`

  const run = async (query: string) => {
    const current = ++generation.current
    if (query) await sleep(150)
    if (generation.current !== current) return
    try {
      const found = await search(types, query, 20)
      if (generation.current === current) setResults({ok: found})
    } catch (error) {
      if (generation.current === current) setResults({error: errorMessage(error)})
    }
  }
  const pick = (chosen: DocPreview) => {
    void choose(target, resolved, chosen)
    setOpen(false)
    onDone()
  }

  let body
  if (!results) {
    body = (
      <Box padding={3}>
        <Spinner muted />
      </Box>
    )
  } else if ('error' in results) {
    body = (
      <Box padding={3}>
        <Text size={1} muted>
          Search failed: {results.error}
        </Text>
      </Box>
    )
  } else if (results.ok.length === 0) {
    body = (
      <Box padding={3}>
        <Text size={1} muted>
          No matching documents
        </Text>
      </Box>
    )
  } else {
    body = results.ok.map((doc) => (
      <Card key={doc.id} as="button" radius={2} padding={2} onClick={() => pick(doc)}>
        <PreviewContent preview={doc} />
      </Card>
    ))
  }

  return (
    <Popover
      ref={popover}
      open={open}
      portal
      matchReferenceWidth
      placement="bottom-start"
      content={
        <Stack gap={1} padding={1} style={{maxHeight: 320, overflow: 'auto'}}>
          {body}
        </Stack>
      }
    >
      <div
        ref={wrapper}
        onFocus={() => {
          if (!open) {
            setOpen(true)
            void run(text)
          }
        }}
      >
        <TextInput
          value={text}
          icon={SearchIcon}
          placeholder={placeholder}
          readOnly={target.readOnly}
          autoFocus={props.autoFocus}
          onChange={(event) => {
            const value = event.currentTarget.value
            setText(value)
            setOpen(true)
            void run(value)
          }}
        />
      </div>
    </Popover>
  )
}

function PreviewWarning(props: {text: string}) {
  return (
    <Flex align="center" gap={2} padding={2}>
      <Text size={1} muted>
        <WarningOutlineIcon />
      </Text>
      <Text size={1} muted textOverflow="ellipsis">
        {props.text}
      </Text>
    </Flex>
  )
}

function ReferenceCard(props: {id: string}) {
  const state = usePreview(props.id)
  switch (state.type) {
    case 'loading':
      return (
        <Flex align="center" gap={2} padding={2}>
          <Skeleton style={{width: 33, height: 33}} radius={1} animated />
          <Skeleton style={{width: '40%', height: '0.8125rem'}} animated />
        </Flex>
      )
    case 'missing':
      return <PreviewWarning text={`Document not found or not accessible: ${props.id}`} />
    case 'failed':
      return <PreviewWarning text={`Could not load the preview of ${props.id}`} />
    case 'ready': {
      const route = {typeName: state.preview.typeName, documentId: state.preview.id}
      return (
        <Card as="a" href={routeHref(route)} radius={2} padding={2} onClick={linkClick(route)}>
          <PreviewContent preview={state.preview} />
        </Card>
      )
    }
    default: {
      const exhaustive: never = state
      return exhaustive
    }
  }
}

function ReferenceMenu(props: {readOnly: boolean; onReplace: () => void; onRemove: () => void}) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  useDismiss(
    open,
    () => setOpen(false),
    () => [button.current, popover.current],
  )
  return (
    <Popover
      ref={popover}
      open={open}
      portal
      placement="bottom-end"
      content={
        <Menu>
          <MenuItem
            text="Replace"
            icon={SyncIcon}
            disabled={props.readOnly}
            onClick={() => {
              setOpen(false)
              props.onReplace()
            }}
          />
          <MenuItem
            text="Remove"
            icon={TrashIcon}
            tone="critical"
            disabled={props.readOnly}
            onClick={() => {
              setOpen(false)
              props.onRemove()
            }}
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

export function ReferenceInput(props: {target: Target; resolved: Resolved}) {
  const {target, resolved} = props
  const value = valueOf(target)
  const reference = isObject(value) && typeof value._ref === 'string' ? value._ref : undefined
  // Replacing applies to the reference it was started for.
  const [replacingFor, setReplacingFor] = useState<string>()
  const replacing = reference !== undefined && replacingFor === reference
  const setReplacing = (next: boolean) => setReplacingFor(next ? reference : undefined)
  if (reference && !replacing) {
    return (
      <Card border radius={2} padding={1}>
        <Flex align="center" gap={1}>
          <Box flex={1}>
            <ReferenceCard id={reference} />
          </Box>
          <ReferenceMenu
            readOnly={target.readOnly}
            onReplace={() => setReplacing(true)}
            onRemove={() => unsetValue(target)}
          />
        </Flex>
      </Card>
    )
  }
  return (
    <Flex gap={1} align="center">
      <Box flex={1}>
        <ReferenceSearch
          target={target}
          resolved={resolved}
          onDone={() => setReplacing(false)}
          autoFocus={reference !== undefined}
        />
      </Box>
      {reference ? <Button mode="bleed" text="Cancel" onClick={() => setReplacing(false)} /> : null}
    </Flex>
  )
}
