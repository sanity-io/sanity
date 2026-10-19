import {Box, Button, Card, Flex, Layer, Select, Stack, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type ReactNode, useMemo, useState} from 'react'
import {useSetVariant} from 'sanity'

import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'

import {type SystemVariant} from '../c1/model'
import {applies, BulkBar, Check, ConfirmDialog, useBulk} from './Actionable'
import {type Column, DataTable} from './DataTable'
import type {Target} from './operations'
import type {Corpus, DocRow, VersionRow} from './useCorpus'

const shortId = (id: string) => id.replace(/^_\.variants\./, '')
const text = (value: ReactNode) => <Text size={1}>{value}</Text>
const muted = (value: ReactNode) => (
  <Text muted size={1}>
    {value}
  </Text>
)
const ago = (iso: string) => {
  if (!iso) return '—'
  const hours = Math.max(0, (Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${Math.floor(hours)}h ago`
  const days = hours / 24
  if (days < 7) return `${Math.floor(days)}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

const DOT = {
  published: 'var(--card-badge-positive-dot-color)',
  draft: 'var(--card-badge-caution-dot-color)',
  release: 'var(--card-badge-suggest-dot-color)',
  absent: 'var(--card-muted-fg-color)',
}

function State({kind, children, faint}: {kind: keyof typeof DOT; children: ReactNode; faint?: boolean}) {
  return (
    <Flex align="center" gap={2}>
      <span
        style={{
          background: kind === 'draft' || kind === 'absent' ? 'none' : DOT[kind],
          border: kind === 'draft' ? `2px solid ${DOT.draft}` : kind === 'absent' ? `1px dashed ${DOT.absent}` : 'none',
          borderRadius: '50%',
          display: 'block',
          flex: 'none',
          height: 8,
          width: 8,
        }}
      />
      <Text muted={faint} size={1}>
        {children}
      </Text>
    </Flex>
  )
}

function Chip({children, tone}: {children: ReactNode; tone?: 'caution'}) {
  return (
    <Card border padding={2} radius="full" tone={tone ?? 'transparent'}>
      <Text size={0}>{children}</Text>
    </Card>
  )
}

const dialogFor = (bulk: ReturnType<typeof useBulk>, corpus: Corpus, address: string, definitions: SystemVariant[]) => (
  <ConfirmDialog address={address} bulk={bulk} corpus={corpus} definitions={definitions} onDone={() => undefined} />
)

export function Notice({bulk}: {bulk: ReturnType<typeof useBulk>}) {
  if (!bulk.notice) return null
  return (
    <Card data-testid="bulk-notice" padding={3} radius={2} tone="positive">
      <Flex align="center" gap={2}>
        <Box flex={1}>
          <Text size={1}>{bulk.notice}</Text>
        </Box>
        <Button fontSize={0} mode="bleed" onClick={() => bulk.setNotice(null)} padding={2} text="Dismiss" />
      </Flex>
    </Card>
  )
}

function releaseTitle(corpus: Corpus, id: string) {
  return corpus.releases.find((r) => r.id === id)?.title ?? id
}

// ---------------------------------------------------------------------------------------------------------------------

interface VRow {
  id: string
  row: VersionRow
  address: string
  rank: string
  stateKind: 'published' | 'draft' | 'release'
  stateText: string
}

/**
 * Document lens, pinned to one document: its stored versions, one per row (address, state, rank, updated). Select rows
 * for Publish, Unpublish, Delete and Add to release. `mini` is the 320px width it has beside a form.
 */
export function DocumentVersionsLens(props: {
  corpus: Corpus
  definitions: SystemVariant[]
  docId: string
  onPin: (id: string) => void
  mini?: boolean
  /** Shows an Expand control that calls this (the C4 inventory opens the full lens). */
  onExpand?: () => void
  /** No pin picker: the lens is pinned to the document it sits in (C4). */
  hidePin?: boolean
  /** A way back to the original document when the pin was changed (the expanded view). */
  onBack?: () => void
}) {
  const {corpus, definitions, docId, onPin, mini, onExpand, hidePin, onBack} = props
  const bulk = useBulk()
  const setVariant = useSetVariant()
  const [shown, setShown] = useState<string | null>(null)
  const doc = corpus.docs.find((d) => d.id === docId) ?? corpus.docs[0]
  const rows: VRow[] = useMemo(() => {
    if (!doc) return []
    const out = doc.list.map((row): VRow => {
      const def = row.variantId ? definitions.find((d) => shortId(d._id) === row.variantId) : undefined
      const title = row.variantId ? (corpus.definitions.find((d) => d.id === row.variantId)?.title ?? row.variantId) : 'Base (no conditions)'
      return {
        id: `${row.variantId ?? 'base'}|${row.bundle}`,
        row,
        address: title,
        rank: row.variantId ? String(def?.priority ?? 0) : '—',
        stateKind: row.bundle === 'published' ? 'published' : row.bundle === 'drafts' ? 'draft' : 'release',
        stateText: row.bundle === 'published' ? 'Published' : row.bundle === 'drafts' ? 'Draft' : releaseTitle(corpus, row.bundle),
      }
    })
    const weight = (r: VRow) => (r.row.variantId ? 1 : 0) * 10 + (r.row.bundle === 'published' ? 0 : r.row.bundle === 'drafts' ? 1 : 2)
    return out.sort((a, b) => weight(a) - weight(b) || a.address.localeCompare(b.address))
  }, [doc, corpus, definitions])

  if (!doc) return muted('No documents yet.')

  const targetOf = (r: VRow): Target => ({
    docId: doc.id,
    title: `${doc.title} · ${r.address} · ${r.stateText}`,
    variantId: r.row.variantId,
    rows: [r.row],
    all: doc.list.filter((v) => v.variantId === r.row.variantId),
  })
  const selectedRows = rows.filter((r) => bulk.selected.has(r.id))
  const all = rows.length > 0 && selectedRows.length === rows.length

  const columns: Column<VRow>[] = [
    {
      key: 'sel',
      title: '',
      header: <Check checked={all} indeterminate={selectedRows.length > 0 && !all} label="Select all" onChange={() => bulk.setAll(rows.map((r) => r.id), !all)} />,
      width: 44,
      render: (r) => <Check checked={bulk.selected.has(r.id)} label={`Select ${r.address}`} onChange={() => bulk.toggle(r.id)} />,
    },
    {key: 'address', title: 'Address', width: mini ? 136 : 300, render: (r) => text(r.address)},
    {key: 'state', title: 'State', width: mini ? 100 : 220, render: (r) => <State kind={r.stateKind}>{r.stateText}</State>},
    ...(mini
      ? []
      : [
          {key: 'rank', title: 'Rank', width: 100, render: (r: VRow) => muted(r.rank)},
          {key: 'updated', title: 'Updated', width: 180, render: (r: VRow) => muted(ago(r.row.updated))},
        ]),
    {
      key: 'act',
      title: '',
      width: 44,
      render: (r) => {
        const target = targetOf(r)
        const items = (['publish', 'unpublish', 'delete', 'deleteAll', 'addToRelease'] as const).filter((op) => applies(op, target))
        const label = {publish: 'Publish', unpublish: 'Unpublish', delete: 'Delete this version', deleteAll: 'Delete all versions', addToRelease: 'Add to release'}
        return (
          <span onClick={(event) => event.stopPropagation()}>
            <MenuButton
              button={<Button aria-label={`Actions for ${r.address}`} fontSize={1} mode="bleed" padding={2} style={{height: 25, width: 25}} text="⋯" />}
              id={`row-menu-${r.id}`}
              menu={
                <Menu>
                  {items.map((op) => (
                    <MenuItem key={op} onClick={() => bulk.open(op, [target])} text={label[op]} tone={op === 'delete' || op === 'deleteAll' ? 'critical' : 'default'} />
                  ))}
                </Menu>
              }
              popover={{portal: true, placement: 'bottom-end'}}
            />
          </span>
        )
      },
    },
  ]

  // Clicking a row shows that version in the document pane: the version (published, drafts or the release) and the
  // variant, set together through the shipped perspective hooks.
  const showVersion = (r: VRow) => {
    setShown(r.id)
    setVariant({variantId: r.row.variantId ? (`_.variants.${r.row.variantId}` as never) : undefined, perspective: r.row.bundle as never})
  }

  return (
    <Stack data-testid="doc-lens" gap={3}>
      <Flex align="center" gap={2}>
        {hidePin ? (
          <Box flex={1}>
            <Text size={1} textOverflow="ellipsis" weight="medium">
              {doc.title}
            </Text>
          </Box>
        ) : (
          <>
            <Text muted size={1}>
              Pinned
            </Text>
            <Select fontSize={1} onChange={(e) => onPin(e.currentTarget.value)} value={doc.id}>
              {corpus.docs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </Select>
            <Box flex={1} />
          </>
        )}
        {onBack ? <Button fontSize={1} mode="bleed" onClick={onBack} padding={2} style={{height: 25}} text="Back to this document" /> : null}
        {onExpand ? <Button fontSize={1} mode="ghost" onClick={onExpand} padding={2} style={{height: 25}} text="Expand" /> : null}
      </Flex>
      <Notice bulk={bulk} />
      <BulkBar bulk={bulk} targets={selectedRows.map(targetOf)} />
      <DataTable columns={columns} empty="This document has no versions." onRowClick={showVersion} rows={rows} selectedId={shown} testId={mini ? 'lens-doc-versions-mini' : 'lens-doc-versions'} />
      {dialogFor(bulk, corpus, doc.title, definitions)}
    </Stack>
  )
}

// ---------------------------------------------------------------------------------------------------------------------

interface DRow {
  id: string
  doc: DocRow
  /** The stored version this row is (absent for a document with no version of the definition). */
  version?: VersionRow
  kind: 'published' | 'draft' | 'release' | 'absent'
  text: string
}

/**
 * Definition lens, pinned to one variant definition. D1 (Delete = one version): one row per STORED version of every
 * document that has one (Published, Draft, or a release), then a grey absent row for each document that has none, with
 * a Create action; the absent block disappears once none is left. Delete removes that row's version only; "Delete all
 * versions" is a separate, more strongly confirmed item.
 */
export function DefinitionDocumentsLens(props: {corpus: Corpus; definitions: SystemVariant[]; variantId: string | null; onPin: (id: string) => void}) {
  const {corpus, definitions, onPin} = props
  const bulk = useBulk()
  const variantId = props.variantId ?? (definitions[0] ? shortId(definitions[0]._id) : null)
  const def = definitions.find((d) => shortId(d._id) === variantId)
  const title = def?.metadata?.title ?? variantId ?? ''

  const rows: DRow[] = useMemo(() => {
    if (!variantId) return []
    const order = (b: string) => (b === 'published' ? 0 : b === 'drafts' ? 1 : 2)
    const present = corpus.docs.flatMap((doc) =>
      doc.list
        .filter((r) => r.variantId === variantId)
        .sort((a, b) => order(a.bundle) - order(b.bundle))
        .map((version): DRow => ({
          id: `${doc.id}|${version.bundle}`,
          doc,
          version,
          kind: version.bundle === 'published' ? 'published' : version.bundle === 'drafts' ? 'draft' : 'release',
          text: version.bundle === 'published' ? 'Published' : version.bundle === 'drafts' ? 'Draft' : `${releaseTitle(corpus, version.bundle)} · draft`,
        })),
    )
    const absent = corpus.docs
      .filter((d) => !d.list.some((r) => r.variantId === variantId))
      .map((doc): DRow => ({id: doc.id, doc, kind: 'absent', text: `No ${title} version`}))
    return [...present.sort((a, b) => a.doc.title.localeCompare(b.doc.title) || order(a.version!.bundle) - order(b.version!.bundle)), ...absent.sort((a, b) => a.doc.title.localeCompare(b.doc.title))]
  }, [corpus, variantId, title])

  if (!variantId) return muted('No variant definitions yet.')

  const present = rows.filter((r) => r.kind !== 'absent')
  const absent = rows.filter((r) => r.kind === 'absent')
  const docsWith = new Set(present.map((r) => r.doc.id))
  const targetOf = (r: DRow): Target => ({
    docId: r.doc.id,
    title: r.version ? `${r.doc.title} · ${r.text}` : r.doc.title,
    variantId,
    rows: r.version ? [r.version] : [],
    all: r.doc.list.filter((v) => v.variantId === variantId),
  })
  const selectedRows = rows.filter((r) => bulk.selected.has(r.id))
  const all = rows.length > 0 && selectedRows.length === rows.length

  const columns: Column<DRow>[] = [
    {
      key: 'sel',
      title: '',
      header: <Check checked={all} indeterminate={selectedRows.length > 0 && !all} label="Select all" onChange={() => bulk.setAll(rows.map((r) => r.id), !all)} />,
      width: 44,
      render: (r) => <Check checked={bulk.selected.has(r.id)} label={`Select ${r.doc.title} ${r.text}`} onChange={() => bulk.toggle(r.id)} />,
    },
    {key: 'title', title: 'Document', width: 300, render: (r) => <Text muted={r.kind === 'absent'} size={1}>{r.doc.title}</Text>},
    {key: 'state', title: title, width: 260, render: (r) => <State faint={r.kind === 'absent'} kind={r.kind}>{r.text}</State>},
    {key: 'updated', title: 'Updated', width: 140, render: (r) => muted(r.version ? ago(r.version.updated) : '—')},
    {
      key: 'act',
      title: '',
      width: 100,
      render: (r) =>
        r.kind === 'absent' ? (
          <Button fontSize={1} mode="bleed" onClick={() => bulk.open('create', [targetOf(r)])} padding={2} text="Create" />
        ) : null,
    },
  ]

  return (
    <Stack data-testid="def-lens" gap={3}>
      <Flex align="center" gap={2}>
        <Text muted size={1}>
          Pinned
        </Text>
        <Select fontSize={1} onChange={(e) => onPin(e.currentTarget.value)} value={variantId}>
          {definitions.map((d) => {
            const id = shortId(d._id)
            const count = corpus.docs.filter((x) => x.variantIds.includes(id)).length
            return (
              <option key={id} value={id}>
                {d.metadata?.title ?? id} · {count} {count === 1 ? 'document' : 'documents'}
              </option>
            )
          })}
        </Select>
      </Flex>
      <Notice bulk={bulk} />
      <Flex gap={2} wrap="wrap">
        <Chip>
          {docsWith.size} of {corpus.docs.length} documents have {title}
        </Chip>
        <Chip>{present.length} stored {present.length === 1 ? 'version' : 'versions'}</Chip>
        {present.filter((r) => r.kind === 'published').length ? <Chip>{present.filter((r) => r.kind === 'published').length} published</Chip> : null}
        {present.filter((r) => r.kind === 'draft').length ? <Chip tone="caution">{present.filter((r) => r.kind === 'draft').length} draft</Chip> : null}
        {present.filter((r) => r.kind === 'release').length ? <Chip tone="caution">{present.filter((r) => r.kind === 'release').length} pending in a release</Chip> : null}
        {absent.length ? <Chip tone="caution">{absent.length} missing</Chip> : null}
      </Flex>
      <BulkBar bulk={bulk} targets={selectedRows.map(targetOf)} variantLabel={title} />
      <DataTable columns={columns} empty="No documents." rows={rows} testId="lens-def-docs" />
      {dialogFor(bulk, corpus, title, definitions)}
    </Stack>
  )
}

/**
 * The expanded view: the same document lens at full width (about 1,112px, the spec's full surface) in an overlay above
 * the Studio. A Layer, so the confirm dialog of a bulk action opens above it. Esc or the close button returns.
 */
export function WideOverlay(props: {title: string; onClose: () => void; children: ReactNode}) {
  return (
    <Layer zOffset={100}>
      <div
        onClick={props.onClose}
        onKeyDown={(event) => {
          if (event.key === 'Escape') props.onClose()
        }}
        role="presentation"
        style={{alignItems: 'center', background: 'rgba(0,0,0,0.45)', display: 'flex', inset: 0, justifyContent: 'center', position: 'fixed'}}
      >
        <Card
          aria-label={props.title}
          data-testid="wide-overlay"
          onClick={(event) => event.stopPropagation()}
          radius={3}
          role="dialog"
          shadow={4}
          style={{display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 64px)', width: 'min(1112px, calc(100vw - 48px))'}}
        >
          <Flex align="center" gap={2} padding={3}>
            <Box flex={1}>
              <Text size={1} weight="medium">
                {props.title}
              </Text>
            </Box>
            <Button fontSize={1} mode="bleed" onClick={props.onClose} padding={2} style={{height: 25}} text="Close" />
          </Flex>
          <Box padding={4} style={{borderTop: '1px solid var(--card-border-color)', overflow: 'auto'}}>
            {props.children}
          </Box>
        </Card>
      </div>
    </Layer>
  )
}

/**
 * The C4 version inventory IS the C5 document lens: mini (320) in the document pane, and an Expand control that opens
 * the same lens at full width, pinned to the same document. In the expanded view the pin picker can move to another
 * document, and "Back to this document" returns to the one the inventory sits in.
 */
export function SharedInventory(props: {corpus: Corpus; definitions: SystemVariant[]; docId: string; bare?: boolean}) {
  const {corpus, definitions, docId, bare} = props
  const [expanded, setExpanded] = useState(false)
  const [pin, setPin] = useState(docId)
  return (
    <Box data-testid="shared-inventory" padding={bare ? 0 : 3} style={{maxWidth: 340}}>
      <DocumentVersionsLens corpus={corpus} definitions={definitions} docId={docId} hidePin mini onExpand={() => { setPin(docId); setExpanded(true) }} onPin={() => undefined} />
      {expanded ? (
        <WideOverlay onClose={() => setExpanded(false)} title="Version inventory">
          <DocumentVersionsLens corpus={corpus} definitions={definitions} docId={pin} onBack={pin !== docId ? () => setPin(docId) : undefined} onPin={setPin} />
        </WideOverlay>
      ) : null}
    </Box>
  )
}
