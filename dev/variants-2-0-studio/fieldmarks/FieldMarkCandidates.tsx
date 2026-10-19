import {Box, Card, Flex, Text} from '@sanity/ui'
import {type ReactNode, useEffect, useState} from 'react'
import {type BlockProps, type FieldProps, useClient, useFormValue} from 'sanity'
import {useRouter} from 'sanity/router'

import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {Tooltip} from '../../../packages/sanity/src/ui-components/tooltip/Tooltip'
import {useOption} from '../options/store'

// CANDIDATES for the open-beta field marks, drawn through the PUBLIC form.components overrides (field, block); nothing
// in core is changed and the shipped mark (the rhombus in the gutter, divergence first, read only) is untouched. They
// show only when the C9 option asks for them (b: block-level portable text marks; c: b plus a removed-items note).
//  - `BlockProps` has no base-variant flag, so a block is compared with the base document BY `_key` here.
//  - A removed item has no node, so a field-level note counts the base items that are missing from the variant.

type Json = unknown
const baseIdOf = (id: string) => id.replace(/^(drafts\.|versions\.[^.]+\.)/, '')

/** The published base document of the document being edited (raw, apiVersion X); null for a base or while loading. */
function useBaseDocument(): Record<string, Json> | null {
  const id = useFormValue(['_id']) as string | undefined
  const client = useClient({apiVersion: 'X'})
  const router = useRouter()
  const isVariant = typeof router.stickyParams.variant === 'string'
  const [doc, setDoc] = useState<Record<string, Json> | null>(null)
  useEffect(() => {
    if (!id || !isVariant) {
      setDoc(null)
      return undefined
    }
    let cancelled = false
    client
      .withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false})
      .fetch('*[_id == $id][0]', {id: baseIdOf(id)})
      .then((d) => !cancelled && setDoc(d ?? null))
      .catch(() => !cancelled && setDoc(null))
    return () => {
      cancelled = true
    }
  }, [client, id, isVariant])
  return doc
}

const get = (value: Json, path: readonly (string | number | {_key: string})[]): Json => {
  let current = value as any
  for (const segment of path) {
    if (current == null) return undefined
    if (typeof segment === 'object') current = Array.isArray(current) ? current.find((i: any) => i?._key === segment._key) : undefined
    else current = current[segment]
  }
  return current
}

const strip = (v: Json): Json => JSON.parse(JSON.stringify(v ?? null, (k, val) => (k === '_key' ? undefined : val)))
const same = (a: Json, b: Json) => JSON.stringify(strip(a)) === JSON.stringify(strip(b))

const MARK_TEXT = 'Changed from base variant'

/** The block-level candidate: the same purple rhombus at the block's left edge. */
export function BlockWithMark(props: BlockProps): ReactNode {
  const option = useOption('c9')
  const base = useBaseDocument()
  const path = props.path as readonly (string | number | {_key: string})[]
  const field = path[0] as string
  const key = (props.value as any)?._key
  const baseBlocks = base ? (get(base, [field]) as any[] | undefined) : undefined
  const baseBlock = baseBlocks?.find((b) => b?._key === key)
  const changed = option !== 'a' && !!baseBlocks && (!baseBlock || !same(baseBlock, props.value))
  if (!changed) return props.renderDefault(props)
  return (
    <Flex data-testid="block-mark" style={{position: 'relative'}}>
      <Box style={{left: -26, position: 'absolute', top: 2}}>
        <Tooltip content={MARK_TEXT} placement="left">
          <Text size={3} style={{'--card-icon-color': 'var(--card-badge-suggest-icon-color)'} as React.CSSProperties}>
            <RhombusIcon />
          </Text>
        </Tooltip>
      </Box>
      <Box flex={1}>{props.renderDefault(props)}</Box>
    </Flex>
  )
}

/** The removed-items candidate: a note under an array field when base items are missing from the variant. */
export function FieldWithRemovedNote(props: FieldProps): ReactNode {
  const option = useOption('c9')
  const base = useBaseDocument()
  const rendered = props.renderDefault(props)
  if (option !== 'c' || !base || props.schemaType.jsonType !== 'array') return rendered
  const path = props.path as readonly (string | number | {_key: string})[]
  const baseItems = get(base, path) as any[] | undefined
  const items = (props.value as any[] | undefined) ?? []
  if (!Array.isArray(baseItems)) return rendered
  const isKeyed = baseItems.some((i) => i && typeof i === 'object' && '_key' in i)
  const removed = baseItems.filter((b) => (isKeyed ? !items.some((i) => i?._key === b?._key) : !items.some((i) => same(i, b))))
  if (!removed.length) return rendered
  return (
    <>
      {rendered}
      <Card data-testid="removed-note" marginTop={2} padding={2} radius={2} tone="transparent">
        <Flex align="center" gap={2}>
          <Text size={1} style={{'--card-icon-color': 'var(--card-badge-suggest-icon-color)'} as React.CSSProperties}>
            <RhombusIcon />
          </Text>
          <Text muted size={0}>
            {removed.length} {removed.length === 1 ? 'item' : 'items'} in the base {removed.length === 1 ? 'is' : 'are'} not in this variant
          </Text>
        </Flex>
      </Card>
    </>
  )
}
