import {Box, Card, Checkbox, Dialog, Flex, Select, Stack, Text} from '@sanity/ui'
import {type ReactNode, useCallback, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {useRouter} from 'sanity/router'

import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import  {type SystemVariant} from '../c1/model'
import  {type ToastValues} from '../toasts/events'
import {useResultToast} from '../toasts/ResultToast'
import {buildActions, type Op, type RowResult, runOp, type Target} from './operations'
import  {type Corpus} from './useCorpus'

// The bulk bar and the confirm dialog of the C5 table (Figma E5, node 3:5679): select rows, the bar offers what applies,
// the dialog names the address, the release and who is affected, then each row reports its own result.

const LABEL: Record<Op, string> = {
  publish: 'Publish',
  unpublish: 'Unpublish',
  delete: 'Delete',
  deleteAll: 'Delete all versions',
  create: 'Create',
  addToRelease: 'Add to release',
}

/** Does the op apply to this row? The bar enables a button when it applies to at least one selected row. */
export function applies(op: Op, t: Target): boolean {
  if (op === 'publish') return t.rows.some((r) => r.bundle === 'drafts')
  if (op === 'unpublish') return t.rows.some((r) => r.bundle === 'published')
  if (op === 'delete') return t.rows.length > 0
  if (op === 'deleteAll') return t.variantId !== null && (t.all ?? t.rows).length > 0
  if (op === 'create') return t.rows.length === 0 && t.variantId !== null
  return t.rows.length > 0
}

/** Rewrites the request the app sends: apiVersion X, raw perspective. */
export function useWriteClient() {
  const studio = useClient({apiVersion: 'X'})
  return useMemo(
    () => studio.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false}),
    [studio],
  )
}

export interface BulkState {
  selected: ReadonlySet<string>
  toggle: (id: string) => void
  setAll: (ids: string[], on: boolean) => void
  clear: () => void
  dialog: {op: Op; targets: Target[]; skipped: number} | null
  /** `skipped` = selected rows the action does not apply to (named in the dialog). */
  open: (op: Op, targets: Target[], skipped?: number) => void
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
    open: (op, targets, skipped = 0) => setDialog({op, targets, skipped}),
    close: () => setDialog(null),
    notice,
    setNotice,
  }
}

/** The checkbox of a row or of the header. */
export function Check(props: {
  checked: boolean
  onChange: () => void
  label: string
  indeterminate?: boolean
}) {
  return (
    <Checkbox
      aria-label={props.label}
      checked={props.checked}
      indeterminate={props.indeterminate}
      onChange={props.onChange}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

/** The action buttons: Publish, Unpublish, Delete, Create <variant> version, Add to release. */
export function BulkActionButtons(props: {
  targets: Target[]
  variantLabel?: string
  onOpen: (op: Op, targets: Target[], skipped?: number) => void
}) {
  const {targets, variantLabel, onOpen} = props
  const ops: Op[] = ['publish', 'unpublish', 'delete', 'deleteAll', 'create', 'addToRelease']
  return (
    <>
      {ops.map((op) => {
        const usable = targets.filter((t) => applies(op, t))
        if (op === 'create' && !variantLabel) return null
        if (op === 'deleteAll' && usable.length === 0) return null
        return (
          <Button
            disabled={usable.length === 0}
            key={op}
            mode="ghost"
            onClick={() => onOpen(op, usable, targets.length - usable.length)}
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
        <Button mode="bleed" onClick={bulk.clear} text="Clear" />
      </Flex>
    </Card>
  )
}

/** "Published", "Draft" or the release's title. */
export function versionName(row: {bundle: string}, corpus: Corpus): string {
  return row.bundle === 'published'
    ? 'Published'
    : row.bundle === 'drafts'
      ? 'Draft'
      : (corpus.releases.find((r) => r.id === row.bundle)?.title ?? row.bundle)
}

const shortId = (id: string) => id.replace(/^_\.variants\./, '')

/**
 * What an audience falls back to when a version stops being served: of the document's other PUBLISHED variant versions
 * whose conditions the audience also meets, the highest priority; else the base document. Drafts and release versions
 * are not served, so nothing changes for anyone.
 */
export function fallbackText(target: Target, corpus: Corpus, definitions: SystemVariant[]): string {
  const served = target.rows.some((r) => r.bundle === 'published')
  if (!served) return 'not served yet: no audience changes'
  const doc = corpus.docs.find((d) => d.id === target.docId)
  if (!target.variantId) return 'visitors with no variant lose this document'
  const mine = definitions.find((d) => shortId(d._id) === target.variantId)
  const audience = mine?.metadata?.title ?? target.variantId
  const remaining = definitions
    .filter((d) => shortId(d._id) !== target.variantId)
    .filter((d) =>
      doc?.list.some((r) => r.variantId === shortId(d._id) && r.bundle === 'published'),
    )
    .filter((d) => Object.entries(d.conditions).every(([k, v]) => mine?.conditions[k] === v))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  const next = remaining[0]
  return `${audience} fall back to ${next ? (next.metadata?.title ?? shortId(next._id)) : 'the base document'}`
}

/**
 * What is served instead when this version goes: the next published variant the audience also meets, else the base document. `null` when the
 * version is not served (a draft, or in a release), so deleting it changes nothing for visitors. Say it as a sentence in the delete dialog.
 */
export function servedInstead(
  target: Target,
  corpus: Corpus,
  definitions: SystemVariant[],
): string | null {
  if (!target.rows.some((r) => r.bundle === 'published')) return null
  if (!target.variantId) return null
  const doc = corpus.docs.find((d) => d.id === target.docId)
  const mine = definitions.find((d) => shortId(d._id) === target.variantId)
  const next = definitions
    .filter((d) => shortId(d._id) !== target.variantId)
    .filter((d) =>
      doc?.list.some((r) => r.variantId === shortId(d._id) && r.bundle === 'published'),
    )
    .filter((d) => Object.entries(d.conditions).every(([k, v]) => mine?.conditions[k] === v))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0]
  return next ? `the ${next.metadata?.title ?? shortId(next._id)} version` : 'the base document'
}

const CONSEQUENCE = (op: Op, address: string, where: string, whereLabel: string): string => {
  if (op === 'publish')
    return `These versions go live now. Visitors who match ${address} are served them.`
  if (op === 'unpublish')
    return `These versions stop being served. Visitors who match ${address} get the base document instead.`
  if (op === 'delete')
    return 'Only the version named above is deleted. The document and its other versions stay. This cannot be undone.'
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
  /** The variant definitions, to say what an audience falls back to when a version goes away. */
  definitions?: SystemVariant[]
  /** The address in words: the variant's title, or "the base document". */
  address: string
  onDone: () => void
}) {
  const {bulk, corpus, address, onDone, definitions = []} = props
  const client = useWriteClient()
  const showToast = useResultToast()
  const router = useRouter()
  const [where, setWhere] = useState('drafts')
  const [results, setResults] = useState<RowResult[] | null>(null)
  const [running, setRunning] = useState(false)
  const dialog = bulk.dialog

  const releases = corpus.releases.filter((r) => r.state === 'active' || r.state === 'scheduled')
  const needsWhere = dialog?.op === 'create' || dialog?.op === 'addToRelease'
  const effectiveWhere =
    dialog?.op === 'addToRelease' && where === 'drafts' ? (releases[0]?.id ?? 'drafts') : where
  const whereLabel =
    effectiveWhere === 'drafts'
      ? 'Drafts'
      : (releases.find((r) => r.id === effectiveWhere)?.title ?? effectiveWhere)

  const close = useCallback(() => {
    setResults(null)
    setRunning(false)
    bulk.close()
  }, [bulk])

  if (!dialog) return null
  const {op, targets, skipped} = dialog
  const n = targets.length

  const run = async () => {
    setRunning(true)
    // Result toasts (Figma C7 / T1): the one toast on screen is the progress, then it is replaced by the result.
    const verb: ToastValues['verb'] | null =
      op === 'create' || op === 'publish'
        ? op
        : op === 'delete' || op === 'deleteAll'
          ? 'delete'
          : null
    const variant = address.replace(/^the /, '').replace(/^./, (c) => c.toUpperCase())
    const toastValues: Partial<ToastValues> = {
      variant,
      document: targets[0]?.title ?? 'The document',
      count: n,
      ...(verb ? {verb} : {}),
    }
    if (verb && n > 1) showToast('in-progress', toastValues)
    const out = await runOp(client, op, targets, effectiveWhere)
    setResults(out)
    setRunning(false)
    const ok = out.filter((r) => r.ok).length
    if (verb) {
      const failed = out.length - ok
      const detail = out.find((r) => !r.ok)?.message
      if (failed === 0) {
        const id =
          verb === 'create'
            ? n === 1
              ? 'version-created'
              : 'versions-created'
            : verb === 'publish'
              ? 'published'
              : 'version-deleted'
        showToast(
          id,
          toastValues,
          id === 'version-created'
            ? () => router.navigateIntent('edit', {id: targets[0].docId})
            : undefined,
        )
      } else if (ok === 0) showToast('failed', {...toastValues, detail}, () => void run())
      else showToast('some-failed', {...toastValues, failed})
    }
    bulk.setNotice(
      ok === out.length
        ? `${ok} ${ok === 1 ? 'version' : 'versions'} ${{publish: 'published', unpublish: 'unpublished', delete: 'deleted', deleteAll: 'deleted (all versions)', create: 'created', addToRelease: 'added'}[op]}${needsWhere ? ` in ${whereLabel}` : ''}.`
        : `${ok} of ${out.length} done; ${out.length - ok} failed. See the results.`,
    )
    bulk.clear()
    window.dispatchEvent(new Event('focus'))
    onDone()
  }

  const versionCount =
    op === 'deleteAll' ? targets.reduce((sum, t) => sum + (t.all ?? t.rows).length, 0) : n
  const title =
    op === 'create'
      ? `Create ${address} versions for ${n} ${n === 1 ? 'document' : 'documents'}`
      : op === 'deleteAll'
        ? `Delete all ${versionCount} versions of ${address} for ${n} ${n === 1 ? 'document' : 'documents'}`
        : `${LABEL[op]} ${n} ${n === 1 ? 'version' : 'versions'}`
  const confirm =
    op === 'create'
      ? `Create ${n} variant ${n === 1 ? 'document' : 'documents'}`
      : op === 'deleteAll'
        ? `Delete all ${versionCount} versions`
        : `${LABEL[op]} ${n}`

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
            <Select
              fontSize={1}
              onChange={(e) => setWhere(e.currentTarget.value)}
              value={effectiveWhere}
            >
              {op === 'create' ? <option value="drafts">Drafts</option> : null}
              {releases.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title ?? r.id}
                </option>
              ))}
            </Select>
          </Flex>
        ) : null}
        {op === 'delete' || op === 'deleteAll' || op === 'unpublish' ? (
          <Stack gap={2} data-testid="fallbacks">
            {targets.map((t) => {
              const list = op === 'deleteAll' ? (t.all ?? t.rows) : t.rows
              const forFallback = op === 'deleteAll' ? {...t, rows: list} : t
              return (
                <Text key={`${t.docId}-${list.map((r) => r._id).join()}`} size={1}>
                  {t.title}
                  <Text as="span" muted size={1}>
                    {op === 'deleteAll'
                      ? ` · ${list.map((r) => versionName(r, corpus)).join(', ')}`
                      : ''}
                    {' · '}
                    {fallbackText(forFallback, corpus, definitions)}
                  </Text>
                </Text>
              )
            })}
          </Stack>
        ) : (
          <Text size={1}>{targets.map((t) => t.title).join(' · ')}</Text>
        )}
        {op === 'delete' && n === 1 ? (
          <Text data-testid="delete-fallback" size={1}>
            {(() => {
              const next = servedInstead(targets[0], corpus, definitions)
              return next
                ? `If you delete this, ${next} will be served instead.`
                : 'This version is not served, so deleting it changes nothing for visitors.'
            })()}
          </Text>
        ) : null}
        <Text muted size={1}>
          {op === 'deleteAll'
            ? `Every version listed above is removed, including drafts and release versions. This cannot be undone.`
            : CONSEQUENCE(op, address, effectiveWhere, whereLabel)}
        </Text>
        {skipped > 0 ? (
          <Text muted size={0}>
            {skipped} selected {skipped === 1 ? 'row is' : 'rows are'} skipped: this action does not
            apply to {skipped === 1 ? 'it' : 'them'}.
          </Text>
        ) : null}
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
              <Button
                disabled={running || n === 0}
                onClick={() => void run()}
                text={running ? 'Working…' : confirm}
                tone={op === 'delete' || op === 'deleteAll' ? 'critical' : 'primary'}
              />
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
