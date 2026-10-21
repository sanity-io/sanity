import {CloseIcon} from '@sanity/icons/Close'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type ComponentType, useMemo, useState} from 'react'
import {type DocumentInspectorProps, insert, PatchEvent, set, unset} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {useVariantDefinitions} from '../c1/world'
import {type Address, isOneMove, NONE, sameAddress} from '../compare/address'
import {BaseNote} from '../compare/BaseNote'
import {setReviewBase, useReviewBase} from '../compare/reviewBase'
import {useAddressDoc, useCompareActions} from '../compare/useCompare'
import {useVersionList} from '../data/useVersionList'
import {useOption} from '../design-options/store'
import {
  type Change,
  type ChangeKind,
  flatten,
  describe,
  type Json,
  type RevertOp,
} from '../fieldmarks/markModel'
import {selectChange} from '../fieldmarks/selection'
import {layerLabel, Pick, usePaneAddress} from '../pane/PaneAddress'

// Option `reviewPanel` (E9, Figma E9 413:7: R1 to R4). A is the stock Review changes panel. B and C replace its body (same inspector, so every
// "Review changes" entry and every change bar opens this one):
//   B  Showing and Against rows, a counterpart picker limited to one-move options (the rest disabled: "Open beta compares one dimension at a time"),
//      the total with filters, Revert per change with Undo (R1 to R3)
//   C  B, plus: the panel reviews the pane it belongs to (R4: Showing is the pane's own address), the selected card thickens its field
//      mark (a two-way link), and "Open full view" leads into the compare. Open: what "Revert all" reverts (drawn: what the panel lists).

let StockComponent: ComponentType<DocumentInspectorProps> | null = null
export function rememberStock(component: ComponentType<DocumentInspectorProps>) {
  StockComponent = component
}

export function ReviewSwitch(props: DocumentInspectorProps) {
  const option = useOption('reviewPanel')
  if (option === 'a' || !StockComponent)
    return StockComponent ? <StockComponent {...props} /> : null
  return <E9Review {...props} full={option === 'c'} />
}

const KIND_WORD: Record<ChangeKind, string> = {
  changed: 'Changed',
  added: 'Added',
  removed: 'Removed',
  moved: 'Moved',
}
const FILTERS: ('all' | ChangeKind)[] = ['all', 'changed', 'added', 'removed', 'moved']

function patchesFor(op: RevertOp, current: Json): unknown[] {
  if (op.op === 'unset') return [unset([...op.path] as never)]
  if (op.op === 'set')
    return [
      op.value === undefined ? unset([...op.path] as never) : set(op.value, [...op.path] as never),
    ]
  const array =
    (op.path.reduce<Json>(
      (v, seg) =>
        typeof seg === 'object'
          ? (v as {_key?: string}[]).find((i) => i._key === seg._key)
          : (v as Record<string, Json>)?.[seg as string],
      current,
    ) as Json[] | undefined) ?? []
  return op.at < array.length
    ? [insert([op.item], 'before', [...op.path, op.at] as never)]
    : [insert([op.item], 'after', [...op.path, -1] as never)]
}

function E9Review(props: DocumentInspectorProps & {full: boolean}) {
  const {onClose, full} = props
  const pane = useDocumentPane()
  const toast = useToast()
  const {local} = usePaneAddress()
  // A published version is read-only: nothing to revert there (F2-AC7: revert only where the reader owns the edited side).
  const readOnlyView = local.perspective === 'published'
  // The inspector sits beside the form, outside its provider: the pane context holds the document value.
  const current = pane.value as Json
  const docId = pane.value?._id?.replace(/^(drafts\.|versions\.[^.]+\.)/, '') ?? ''
  const definitions = useVariantDefinitions()
  const versions = useVersionList(docId)
  const actions = useCompareActions()
  const compare = useOption('compare')

  // The one base (compare/reviewBase): the published version at this address unless the user picked another address.
  const {base: against} = useReviewBase(local)
  const setAgainst = (address: Address) => setReviewBase(address, local)
  const againstDoc = useAddressDoc(docId, against)
  const [filter, setFilter] = useState<'all' | ChangeKind>('all')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const titleOf = (id: string) =>
    id === NONE
      ? 'Base'
      : (definitions.find((d) => d._id.replace(/^_\.variants\./, '') === id)?.metadata?.title ?? id)
  const text = (a: Address) => `${layerLabel(a.perspective)} · ${titleOf(a.variant)}`
  const variantIds = [
    ...new Set((versions ?? []).map((v) => v.variantId).filter((v): v is string => !!v)),
  ]
  const options: Address[] = []
  for (const perspective of ['published', 'drafts'])
    for (const variant of [NONE, ...variantIds]) options.push({perspective, variant})

  const changes = useMemo(
    () => (againstDoc.ready ? flatten(againstDoc.doc, current) : []),
    [againstDoc.ready, againstDoc.doc, current],
  )
  const shown = changes.filter((c) => filter === 'all' || c.kind === filter)
  const count = (k: 'all' | ChangeKind) =>
    k === 'all' ? changes.length : changes.filter((c) => c.kind === k).length

  const revert = (change: Change) => {
    const before = current
    pane.onChange(PatchEvent.from(patchesFor(change.revert, current) as never))
    const top = change.path[0]
    const undo = () => {
      // Undo puts the top-level field back as it was before the revert.
      const was = typeof top === 'string' ? (before as Record<string, Json>)?.[top] : undefined
      if (typeof top === 'string')
        pane.onChange(
          PatchEvent.from([was === undefined ? unset([top]) : set(was, [top])] as never),
        )
    }
    toast.push({
      id: 'e9-revert',
      status: 'success',
      title: `Reverted ${change.label}`,
      description: (
        <Button
          data-testid="undo-revert"
          fontSize={1}
          mode="ghost"
          onClick={undo}
          padding={2}
          text="Undo"
        />
      ),
      duration: 8000,
    })
  }
  const revertAll = () => [...shown].reverse().forEach(revert)

  const select = (change: Change) => {
    setSelectedKey(change.key)
    if (full) selectChange(change.path)
    const field = String(change.path.find((s) => typeof s === 'string') ?? '')
    document
      .querySelector(`[data-testid="document-pane"] [data-testid="field-${field}"]`)
      ?.scrollIntoView({block: 'center', behavior: 'smooth'})
  }

  return (
    <Flex data-testid="e9-review" direction="column" height="fill" style={{minWidth: 0}}>
      <Flex
        align="center"
        gap={2}
        padding={3}
        style={{borderBottom: '1px solid var(--card-border-color)'}}
      >
        <Box flex={1}>
          <Text size={1} weight="semibold">
            Review changes
          </Text>
        </Box>
        <Button
          aria-label="Close"
          icon={CloseIcon}
          mode="bleed"
          onClick={() => {
            selectChange(null)
            onClose()
          }}
          padding={2}
        />
      </Flex>
      <Stack gap={3} padding={3}>
        <Flex align="center" gap={2}>
          <Box style={{width: 64}}>
            <Text muted size={1}>
              Showing
            </Text>
          </Box>
          <span data-testid="review-showing" style={chip}>
            {text(local)}
            {full ? ' · this pane' : ''}
          </span>
        </Flex>
        <Flex align="center" gap={2}>
          <Box style={{width: 64}}>
            <Text muted size={1}>
              Against
            </Text>
          </Box>
          <Pick
            items={options.map((address) => {
              const allowed = isOneMove(local, address)
              return {
                key: `${address.perspective}|${address.variant}`,
                text: allowed
                  ? text(address)
                  : `${text(address)} · Open beta compares one dimension at a time`,
                selected: sameAddress(address, against),
                disabled: !allowed,
                onClick: () => setAgainst(address),
              }
            })}
            testId="review-against"
            text={text(against)}
          />
        </Flex>
        <BaseNote base={against} label={text} showing={local} />
        <Flex align="center" gap={1} wrap="wrap">
          {FILTERS.map((k) => (
            <Button
              key={k}
              data-testid={`review-filter-${k}`}
              disabled={count(k) === 0 && k !== 'all'}
              fontSize={1}
              mode={filter === k ? 'default' : 'bleed'}
              onClick={() => setFilter(k)}
              padding={2}
              selected={filter === k}
              text={`${k === 'all' ? 'All' : KIND_WORD[k]} · ${count(k)}`}
            />
          ))}
        </Flex>
        <Flex align="center" gap={2}>
          <Box flex={1}>
            <Text data-testid="review-total" muted size={1}>
              {changes.length === 0
                ? 'No changes'
                : `${changes.length} ${changes.length === 1 ? 'change' : 'changes'}`}
            </Text>
          </Box>
          {full ? (
            <Button
              data-testid="review-full-view"
              disabled={compare === 'a'}
              fontSize={1}
              mode="ghost"
              onClick={() => {
                // Below about 1700 px the rack cannot hold a panel and two panes: the panel hands over to the lane compare (its change list does the same job).
                // The panel closes first, then the second pane opens, so the two navigations do not overwrite each other.
                if (window.innerWidth < 1700) onClose()
                window.setTimeout(
                  () => actions.openBeside(docId, against),
                  window.innerWidth < 1700 ? 400 : 0,
                )
              }}
              padding={2}
              text="Open full view"
              title={compare === 'a' ? 'Turn Compare on to open the full view' : undefined}
            />
          ) : null}
          {shown.length > 1 ? (
            <Button
              data-testid="review-revert-all"
              fontSize={1}
              mode="ghost"
              onClick={revertAll}
              padding={2}
              text="Revert all"
              tone="critical"
            />
          ) : null}
        </Flex>
      </Stack>
      <Box flex={1} overflow="auto" padding={3} paddingTop={0}>
        <Stack gap={2}>
          {shown.map((change) => (
            <Card
              key={change.key}
              border
              data-kind={change.kind}
              data-selected={selectedKey === change.key ? '' : undefined}
              data-testid="review-card"
              onClick={() => select(change)}
              padding={3}
              radius={2}
              role="button"
              selected={selectedKey === change.key}
              style={{cursor: 'pointer'}}
              tabIndex={0}
            >
              <Stack gap={2}>
                <Flex align="center" gap={2}>
                  <Box flex={1}>
                    <Text size={1} weight="semibold">
                      {change.label}
                    </Text>
                  </Box>
                  <Text muted size={0}>
                    {KIND_WORD[change.kind]}
                  </Text>
                </Flex>
                {change.before !== undefined ? (
                  <Card padding={2} radius={2} tone="critical">
                    <Text size={1}>{describe(change.before)}</Text>
                  </Card>
                ) : null}
                {change.after !== undefined ? (
                  <Card padding={2} radius={2} tone="positive">
                    <Text size={1}>
                      {change.kind === 'moved'
                        ? `Moved to position ${Number(change.after) + 1}`
                        : describe(change.after)}
                    </Text>
                  </Card>
                ) : null}
                <Flex>
                  <Button
                    data-testid="review-revert"
                    disabled={readOnlyView}
                    title={
                      readOnlyView
                        ? 'Open the Draft to revert: this version is read-only'
                        : undefined
                    }
                    fontSize={1}
                    mode="ghost"
                    onClick={(event) => {
                      event.stopPropagation()
                      revert(change)
                    }}
                    padding={2}
                    text="Revert"
                  />
                </Flex>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Box>
    </Flex>
  )
}

const chip = {
  background: 'var(--card-badge-default-bg-color)',
  borderRadius: 999,
  fontSize: 13,
  padding: '3px 10px',
} as const
