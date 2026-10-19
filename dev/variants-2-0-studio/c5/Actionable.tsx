import {Box, Button, Card, Dialog, Flex, Select, Stack, Text} from '@sanity/ui'
import {type ReactNode, useCallback, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {buildActions, type Op, type RowResult, runOp, type Target} from './operations'
import type {Corpus} from './useCorpus'

// The bulk bar and the confirm dialog of the C5 table (Figma E5, node 3:5679): select rows, the bar offers what applies,
// the dialog names the address, the release and who is affected, then each row reports its own result.

const LABEL: Record<Op, string> = {
  publish: 'Publish',
  unpublish: 'Unpublish',
  delete: 'Delete',
  create: 'Create',
  addToRelease: 'Add to release',
}

/** Does the op apply to this row? The bar enables a button when it applies to at least one selected row. */
export function applies(op: Op, t: Target): boolean {
  if (op === 'publish') return t.rows.some((r) => r.bundle === 'drafts')
  if (op === 'unpublish') return t.rows.some((r) => r.bundle === 'published')
  if (op === 'delete') return t.rows.length > 0
  if (op === 'create') return t.rows.length === 0 && t.variantId !== null
  return t.rows.length > 0
}

/** Rewrites the request the app sends: apiVersion X, raw perspective. */
export function useWriteClient() {
  const studio = useClient({apiVersion: 'X'})
  return useMemo(() => studio.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false}), [studio])
}

export interface BulkState {
  selected: ReadonlySet<string>
  toggle: (id: string) => void
  setAll: (ids: string[], on: boolean) => void
  clear: () => void
  dialog: {op: Op; targets: Target[]} | null
  open: (op: Op, targets: Target[]) => void
  close: () => void
  /** The last finished run, shown above the table. */
  notice: string | null
  setNotice: (text: string | null) => void
}

export function useBulk(): BulkState {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [dialog, setDialog] = useState<BulkState['dialog']>(null)
  const [notice, setNotice] = useState<string | null>(null)
  return {
    selected,
    toggle: (id) =>
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      }),
    setAll: (ids, on) => setSelected(on ? new Set(ids) : new Set()),
    clear: () => setSelected(new Set()),
    dialog,
    open: (op, targets) => setDialog({op, targets}),
    close: () => setDialog(null),
    notice,
    setNotice,
  }
}

/** The checkbox of a row or of the header. */
export function Check(props: {checked: boolean; onChange: () => void; label: string; indeterminate?: boolean}) {
  return (
    <input
      aria-label={props.label}
      checked={props.checked}
      onChange={props.onChange}
      onClick={(e) => e.stopPropagation()}
      ref={(el) => {
        if (el) el.indeterminate = !!props.indeterminate
      }}
      style={{cursor: 'pointer', height: 16, width: 16}}
      type="checkbox"
    />
  )
}

/** The action buttons: Publish, Unpublish, Delete, Create <variant> version, Add to release. */
export function BulkActionButtons(props: {targets: Target[]; variantLabel?: string; onOpen: (op: Op, targets: Target[]) => void}) {
  const {targets, variantLabel, onOpen} = props
  const ops: Op[] = ['publish', 'unpublish', 'delete', 'create', 'addToRelease']
  return (
    <>
      {ops.map((op) => {
        const usable = targets.filter((t) => applies(op, t))
        if (op === 'create' && !variantLabel) return null
        return (
          <Button
            disabled={usable.length === 0}
            fontSize={1}
            key={op}
            mode="ghost"
            onClick={() => onOpen(op, usable)}
            padding={2}
            style={{height: 25}}
            text={op === 'create' ? `Create ${variantLabel} version` : LABEL[op]}
          />
        )
      })}
    </>
  )
}

/** "2 selected · Publish · Unpublish · Delete · Create German version · Add to release · Clear" */
export function BulkBar(props: {bulk: BulkState; targets: Target[]; variantLabel?: string}) {
  const {bulk, targets, variantLabel} = props
  if (!targets.length) return null
  return (
    <Card data-testid="bulk-bar" padding={2} radius={2} tone="primary">
      <Flex align="center" gap={2} wrap="wrap">
        <Text size={1} weight="medium">
          {targets.length} selected
        </Text>
        <BulkActionButtons onOpen={bulk.open} targets={targets} variantLabel={variantLabel} />
        <Box flex={1} />
        <Button fontSize={1} mode="bleed" onClick={bulk.clear} padding={2} style={{height: 25}} text="Clear" />
      </Flex>
    </Card>
  )
}

const CONSEQUENCE = (op: Op, address: string, where: string, whereLabel: string): string => {
  if (op === 'publish') return `These versions go live now. Visitors who match ${address} are served them.`
  if (op === 'unpublish') return `These versions stop being served. Visitors who match ${address} get the base document instead.`
  if (op === 'delete') return `These versions are deleted, with any draft or release version at ${address}. This cannot be undone.`
  if (op === 'create')
    return where === 'drafts'
      ? "Each is created from the document's base, as a draft. Nobody is served it until you publish it."
      : `Each is created from the document's base, as a draft inside ${whereLabel}. Nobody is served them until the release publishes.`
  return `A copy of each version is added to ${whereLabel}. The original stays where it is.`
}

/** The confirm dialog: address, where (for create and add to release), who is affected; then per-row results. */
export function ConfirmDialog(props: {
  bulk: BulkState
  corpus: Corpus
  /** The address in words: the variant's title, or "the base document". */
  address: string
  onDone: () => void
}) {
  const {bulk, corpus, address, onDone} = props
  const client = useWriteClient()
  const [where, setWhere] = useState('drafts')
  const [results, setResults] = useState<RowResult[] | null>(null)
  const [running, setRunning] = useState(false)
  const dialog = bulk.dialog

  const releases = corpus.releases.filter((r) => r.state === 'active' || r.state === 'scheduled')
  const needsWhere = dialog?.op === 'create' || dialog?.op === 'addToRelease'
  const effectiveWhere = dialog?.op === 'addToRelease' && where === 'drafts' ? (releases[0]?.id ?? 'drafts') : where
  const whereLabel = effectiveWhere === 'drafts' ? 'Drafts' : (releases.find((r) => r.id === effectiveWhere)?.title ?? effectiveWhere)

  const close = useCallback(() => {
    setResults(null)
    setRunning(false)
    bulk.close()
  }, [bulk])

  if (!dialog) return null
  const {op, targets} = dialog
  const n = targets.length

  const run = async () => {
    setRunning(true)
    const out = await runOp(client, op, targets, effectiveWhere)
    setResults(out)
    setRunning(false)
    const ok = out.filter((r) => r.ok).length
    bulk.setNotice(
      ok === out.length
        ? `${ok} ${ok === 1 ? 'version' : 'versions'} ${{publish: 'published', unpublish: 'unpublished', delete: 'deleted', create: 'created', addToRelease: 'added'}[op]}${needsWhere ? ` in ${whereLabel}` : ''}.`
        : `${ok} of ${out.length} done; ${out.length - ok} failed. See the results.`,
    )
    bulk.clear()
    window.dispatchEvent(new Event('focus'))
    onDone()
  }

  const title =
    op === 'create'
      ? `Create ${address} versions for ${n} ${n === 1 ? 'document' : 'documents'}`
      : `${LABEL[op]} ${n} ${n === 1 ? 'version' : 'versions'}`
  const confirm = op === 'create' ? `Create ${n} variant ${n === 1 ? 'document' : 'documents'}` : `${LABEL[op]} ${n}`

  let body: ReactNode
  if (results) {
    body = (
      <Stack gap={2} data-testid="bulk-results">
        {results.map((r) => {
          const doc = corpus.docs.find((d) => d.id === r.docId)
          return (
            <Flex gap={2} key={r.docId}>
              <Text size={1}>{r.ok ? '✓' : '✕'}</Text>
              <Box flex={1}>
                <Text size={1}>{doc?.title ?? r.docId}</Text>
              </Box>
              <Text muted size={1}>
                {r.message}
              </Text>
            </Flex>
          )
        })}
      </Stack>
    )
  } else {
    body = (
      <Stack gap={4}>
        <Flex align="center" gap={3}>
          <Box style={{width: 64}}>
            <Text muted size={1}>
              Address
            </Text>
          </Box>
          <Card border padding={2} radius={2} tone="transparent">
            <Text size={1}>{address}</Text>
          </Card>
        </Flex>
        {needsWhere ? (
          <Flex align="center" gap={3}>
            <Box style={{width: 64}}>
              <Text muted size={1}>
                Where
              </Text>
            </Box>
            <Select fontSize={1} onChange={(e) => setWhere(e.currentTarget.value)} value={effectiveWhere}>
              {op === 'create' ? <option value="drafts">Drafts</option> : null}
              {releases.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title ?? r.id}
                </option>
              ))}
            </Select>
          </Flex>
        ) : null}
        <Text size={1}>{targets.map((t) => t.title).join(' · ')}</Text>
        <Text muted size={1}>
          {CONSEQUENCE(op, address, effectiveWhere, whereLabel)}
        </Text>
      </Stack>
    )
  }

  return (
    <Dialog
      footer={
        <Flex gap={2} justify="flex-end" padding={3}>
          {results ? (
            <Button mode="ghost" onClick={close} text="Close" />
          ) : (
            <>
              <Button disabled={running} mode="ghost" onClick={close} text="Cancel" />
              <Button disabled={running || n === 0} onClick={() => void run()} text={running ? 'Working…' : confirm} tone={op === 'delete' ? 'critical' : 'primary'} />
            </>
          )}
        </Flex>
      }
      header={results ? 'Results' : title}
      id="c5-confirm"
      onClose={close}
      width={1}
    >
      <Box padding={4}>{body}</Box>
    </Dialog>
  )
}

export {buildActions}
