import {Badge, Box, Button, Card, Flex, Layer, Select, Stack, Text, TextInput} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {type ReactNode, useMemo, useState} from 'react'
import {useSetVariant} from 'sanity'

import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'

import {type SystemVariant} from '../c1/model'
import {applies, BulkBar, Check, ConfirmDialog, useBulk} from './Actionable'
import {useOpenVersion} from './openVersion'
import {type Column, DataTable, type RowGroup} from './DataTable'
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

/** The command lane's filters (Storybook anatomy: State, Address and Release sections, multi-select, Clear filters). */
interface LensFilter {
  text: string
  state: ('published' | 'draft' | 'release')[]
  address: string[]
  release: string[]
}
const NO_LENS_FILTER: LensFilter = {text: '', state: [], address: [], release: []}
const toggleIn = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])

/** Saved views: a filter set and a grouping. FAST FOLLOW, shown as a candidate (no saving yet). */
const SAVED_VIEWS = (addresses: string[]): {id: string; label: string; filter: LensFilter; group: 'date' | 'none'}[] => [
  {id: 'all', label: 'All versions', filter: NO_LENS_FILTER, group: 'none'},
  {id: 'to-publish', label: 'Drafts to publish', filter: {...NO_LENS_FILTER, state: ['draft']}, group: 'none'},
  {id: 'live-variants', label: 'Live variants', filter: {...NO_LENS_FILTER, state: ['published'], address: addresses.filter((a) => !a.startsWith('Base'))}, group: 'none'},
  {id: 'by-date', label: 'By publish date', filter: NO_LENS_FILTER, group: 'date'},
]

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
  /** The lens sits in the document's own pane (the inspector): a row only switches the pane's version. */
  inPane?: boolean
}) {
  const {corpus, definitions, docId, onPin, mini, onExpand, hidePin, onBack, inPane} = props
  const openVersion = useOpenVersion()
  const bulk = useBulk()
  const setVariant = useSetVariant()
  const [shown, setShown] = useState<string | null>(null)
  // The command lane (Andrej's intent): group by publish date, sort, filter. Saved views are a fast-follow candidate.
  const [groupBy, setGroupBy] = useState<'date' | 'none'>('none')
  const [sort, setSort] = useState<{by: 'address' | 'state' | 'updated'; order: 'asc' | 'desc'}>({by: 'address', order: 'asc'})
  const [filter, setFilter] = useState<LensFilter>(NO_LENS_FILTER)
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
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

  // Filter, then sort; groups are built from what is left.
  const stateWeight = (r: VRow) => (r.stateKind === 'published' ? 0 : r.stateKind === 'draft' ? 1 : 2)
  const visible = rows
    .filter(
      (r) =>
        (!filter.state.length || filter.state.includes(r.stateKind)) &&
        (!filter.address.length || filter.address.includes(r.address)) &&
        (!filter.release.length || filter.release.includes(r.row.bundle)) &&
        (!filter.text.trim() || r.address.toLowerCase().includes(filter.text.trim().toLowerCase())),
    )
    .sort((a, b) => {
      const dir = sort.order === 'asc' ? 1 : -1
      if (sort.by === 'state') return dir * (stateWeight(a) - stateWeight(b) || a.address.localeCompare(b.address))
      if (sort.by === 'updated') return dir * (a.row.updated < b.row.updated ? -1 : a.row.updated > b.row.updated ? 1 : 0)
      return dir * a.address.localeCompare(b.address)
    })
  const groupTitle = (bundle: string) => {
    if (bundle === 'published') return 'Published'
    if (bundle === 'drafts') return 'Drafts'
    const release = corpus.releases.find((r) => r.id === bundle)
    const when = release?.at ? new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short'}).format(new Date(release.at)) : null
    return `${when ? `${when} · ` : ''}${release?.title ?? bundle}`
  }
  const groupOrder = (bundle: string) => {
    if (bundle === 'published') return [0, '']
    if (bundle === 'drafts') return [3, '']
    const at = corpus.releases.find((r) => r.id === bundle)?.at
    return at ? [1, at] : [2, bundle]
  }
  const groups: RowGroup<VRow>[] | undefined =
    groupBy === 'date'
      ? [...new Set(visible.map((r) => r.row.bundle))]
          .sort((a, b) => {
            const [wa, ka] = groupOrder(a)
            const [wb, kb] = groupOrder(b)
            return (wa as number) - (wb as number) || String(ka).localeCompare(String(kb))
          })
          .map((bundle) => ({
            id: bundle,
            title: groupTitle(bundle),
            rows: visible.filter((r) => r.row.bundle === bundle),
            collapsed: collapsed.has(bundle),
            onToggle: () =>
              setCollapsed((prev) => {
                const next = new Set(prev)
                if (next.has(bundle)) next.delete(bundle)
                else next.add(bundle)
                return next
              }),
          }))
      : undefined
  const releaseIds = [...new Set(rows.filter((r) => r.stateKind === 'release').map((r) => r.row.bundle))]
  const activeFilters = filter.state.length + filter.address.length + filter.release.length + (filter.text.trim() ? 1 : 0)
  const addressList = [...new Set(rows.map((r) => r.address))].sort()
  const views = SAVED_VIEWS(addressList)
  const currentView = views.find((v) => v.group === groupBy && JSON.stringify(v.filter) === JSON.stringify({...filter, text: ''}) && !filter.text.trim())
  const SORTS = [
    ['address', 'Address'],
    ['state', 'State'],
    ['updated', 'Updated'],
  ] as const

  const targetOf = (r: VRow): Target => ({
    docId: doc.id,
    title: `${doc.title} · ${r.address} · ${r.stateText}`,
    variantId: r.row.variantId,
    rows: [r.row],
    all: doc.list.filter((v) => v.variantId === r.row.variantId),
  })
  const selectedRows = visible.filter((r) => bulk.selected.has(r.id))
  const all = visible.length > 0 && selectedRows.length === visible.length

  const sortHeader = (by: 'address' | 'state' | 'updated', label: string) => (
    <Button
      data-testid={`sort-${by}`}
      fontSize={1}
      mode="bleed"
      onClick={() => setSort((cur) => ({by, order: cur.by === by && cur.order === 'asc' ? 'desc' : 'asc'}))}
      padding={1}
      text={`${label}${sort.by === by ? (sort.order === 'asc' ? ' ↑' : ' ↓') : ''}`}
    />
  )

  const columns: Column<VRow>[] = [
    {
      key: 'sel',
      title: '',
      header: <Check checked={all} indeterminate={selectedRows.length > 0 && !all} label="Select all" onChange={() => bulk.setAll(visible.map((r) => r.id), !all)} />,
      width: 44,
      render: (r) => <Check checked={bulk.selected.has(r.id)} label={`Select ${r.address}`} onChange={() => bulk.toggle(r.id)} />,
    },
    {key: 'address', title: 'Address', header: sortHeader('address', 'Address'), width: mini ? 136 : 300, render: (r) => text(r.address)},
    {key: 'state', title: 'State', header: sortHeader('state', 'State'), width: mini ? 100 : 220, render: (r) => <State kind={r.stateKind}>{r.stateText}</State>},
    ...(mini
      ? []
      : [
          {key: 'rank', title: 'Rank', width: 100, render: (r: VRow) => muted(r.rank)},
          {key: 'updated', title: 'Updated', header: sortHeader('updated', 'Updated'), width: 180, render: (r: VRow) => muted(ago(r.row.updated))},
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
    if (inPane) {
      setVariant({variantId: r.row.variantId ? (`_.variants.${r.row.variantId}` as never) : undefined, perspective: r.row.bundle as never})
    } else {
      openVersion(doc.id, doc.type, r.row.variantId, r.row.bundle)
    }
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
      <Flex align="center" data-testid="lens-command-lane" gap={1} wrap="wrap">
        <TextInput
          aria-label="Find an address"
          fontSize={1}
          onChange={(e) => {
            const text = e.currentTarget.value
            setFilter((f) => ({...f, text}))
          }}
          padding={2}
          placeholder="Find an address"
          style={{height: 25, width: mini ? 130 : 180}}
          value={filter.text}
        />
        <MenuButton
          button={<Button data-testid="filter-button" fontSize={1} mode="ghost" padding={2} style={{height: 25}} text={filter.state.length + filter.address.length + filter.release.length ? `Filter · ${filter.state.length + filter.address.length + filter.release.length}` : 'Filter'} />}
          id="lens-filter-menu"
          menu={
            <Menu data-testid="filter-menu" padding={0}>
              <Box paddingX={3} paddingY={2}><Text muted size={0} weight="medium">State</Text></Box>
              {([['published', 'Published'], ['draft', 'Draft'], ['release', 'In a release']] as const).map(([key, label]) => (
                <MenuItem data-testid={`filter-state-${key}`} key={key} onClick={() => setFilter((f) => ({...f, state: toggleIn(f.state, key)}))} pressed={filter.state.includes(key)} selected={filter.state.includes(key)} text={label} />
              ))}
              <MenuDivider />
              <Box paddingX={3} paddingY={2}><Text muted size={0} weight="medium">Address</Text></Box>
              {addressList.map((a) => (
                <MenuItem data-testid={`filter-address-${a}`} key={a} onClick={() => setFilter((f) => ({...f, address: toggleIn(f.address, a)}))} pressed={filter.address.includes(a)} selected={filter.address.includes(a)} text={a} />
              ))}
              {releaseIds.length ? <MenuDivider /> : null}
              {releaseIds.length ? <Box paddingX={3} paddingY={2}><Text muted size={0} weight="medium">Release</Text></Box> : null}
              {releaseIds.map((id) => (
                <MenuItem data-testid={`filter-release-${id}`} key={id} onClick={() => setFilter((f) => ({...f, release: toggleIn(f.release, id)}))} pressed={filter.release.includes(id)} selected={filter.release.includes(id)} text={releaseTitle(corpus, id)} />
              ))}
            </Menu>
          }
          popover={{portal: true, placement: 'bottom-start'}}
        />
        {activeFilters ? <Button data-testid="filter-clear" fontSize={1} mode="bleed" onClick={() => setFilter(NO_LENS_FILTER)} padding={2} style={{height: 25}} text="Clear filters" /> : null}
        <Button data-testid="group-toggle" fontSize={1} mode="ghost" onClick={() => setGroupBy(groupBy === 'date' ? 'none' : 'date')} padding={2} selected={groupBy === 'date'} style={{height: 25}} text={mini ? 'Group' : 'Group by publish date'} />
        <MenuButton
          button={<Button data-testid="view-picker" fontSize={1} mode="ghost" padding={2} style={{height: 25}} text={mini ? 'View' : `View: ${currentView?.label ?? 'Custom'}`} />}
          id="lens-view-menu"
          menu={
            <Menu data-testid="view-menu" padding={0}>
              <Box paddingX={3} paddingY={2}><Text muted size={0} weight="medium">Saved views</Text></Box>
              {views.map((v) => (
                <MenuItem data-testid={`view-${v.id}`} key={v.id} onClick={() => { setFilter(v.filter); setGroupBy(v.group) }} pressed={currentView?.id === v.id} selected={currentView?.id === v.id} text={v.label} />
              ))}
              <MenuDivider />
              <MenuItem disabled text="Save current view" />
            </Menu>
          }
          popover={{portal: true, placement: 'bottom-start'}}
        />
        {mini ? null : <Badge data-testid="view-candidate" tone="suggest">Candidate, fast follow</Badge>}
      </Flex>
      <BulkBar bulk={bulk} targets={selectedRows.map(targetOf)} />
      <DataTable columns={columns} empty={rows.length ? 'No version matches the filter.' : 'This document has no versions.'} groups={groups} onRowClick={showVersion} rows={visible} selectedId={shown} testId={mini ? 'lens-doc-versions-mini' : 'lens-doc-versions'} />
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
  const openVersion = useOpenVersion()
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
      <DataTable columns={columns} empty="No documents." onRowClick={(r) => openVersion(r.doc.id, r.doc.type, r.version ? variantId : null, r.version?.bundle ?? 'drafts')} rows={rows} testId="lens-def-docs" />
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
      <DocumentVersionsLens corpus={corpus} definitions={definitions} docId={docId} hidePin inPane mini onExpand={() => { setPin(docId); setExpanded(true) }} onPin={() => undefined} />
      {expanded ? (
        <WideOverlay onClose={() => setExpanded(false)} title="Version inventory">
          <DocumentVersionsLens corpus={corpus} definitions={definitions} docId={pin} onBack={pin !== docId ? () => setPin(docId) : undefined} onPin={setPin} />
        </WideOverlay>
      ) : null}
    </Box>
  )
}
