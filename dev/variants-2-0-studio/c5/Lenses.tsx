import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type ReactNode, useMemo, useState} from 'react'

import {type DimensionSpec, type SystemVariant, valueTitle} from '../c1/model'
import {type Column, DataTable} from './DataTable'
import {type Corpus, type DocRow} from './useCorpus'

const text = (value: ReactNode) => <Text size={1}>{value}</Text>
const muted = (value: ReactNode) => (
  <Text muted size={1}>
    {value}
  </Text>
)

const shortId = (id: string) => id.replace(/^_\.variants\./, '')
const variantTitle = (v: SystemVariant) => v.metadata?.title ?? shortId(v._id)
const dateLabel = (iso: string) =>
  iso ? new Intl.DateTimeFormat('en-GB', {day: 'numeric', hour: '2-digit', minute: '2-digit', month: 'short'}).format(new Date(iso)) : ''

/** Document lens, full: one row per document, with how many versions, variants and releases it has. */
export function DocumentLens(props: {
  corpus: Corpus
  mini?: boolean
  selectedId?: string | null
  onSelect?: (id: string) => void
}) {
  const {corpus, mini, selectedId, onSelect} = props
  const columns: Column<DocRow>[] = mini
    ? [
        {key: 'title', title: 'Document', width: 190, render: (r) => text(r.title), sort: (a, b) => a.title.localeCompare(b.title)},
        {key: 'versions', title: 'Versions', width: 100, render: (r) => text(r.versions), sort: (a, b) => a.versions - b.versions},
      ]
    : [
        {key: 'title', title: 'Document', width: 280, render: (r) => text(r.title), sort: (a, b) => a.title.localeCompare(b.title)},
        {
          key: 'status',
          title: 'Base',
          width: 190,
          render: (r) => muted(r.draft && r.published ? 'Published + draft' : r.published ? 'Published' : r.draft ? 'Draft only' : 'Release only'),
        },
        {
          key: 'variants',
          title: 'Variants',
          width: 120,
          render: (r) => (r.variantIds.length ? text(r.variantIds.length) : muted('None')),
          sort: (a, b) => a.variantIds.length - b.variantIds.length,
        },
        {key: 'versions', title: 'Versions', width: 120, render: (r) => text(r.versions), sort: (a, b) => a.versions - b.versions},
        {
          key: 'releases',
          title: 'In releases',
          width: 130,
          render: (r) => (r.releaseIds.length ? text(r.releaseIds.length) : muted('None')),
          sort: (a, b) => a.releaseIds.length - b.releaseIds.length,
        },
        {key: 'updated', title: 'Updated', width: 170, render: (r) => muted(dateLabel(r.updated)), sort: (a, b) => (a.updated < b.updated ? -1 : 1)},
      ]
  return (
    <DataTable
      columns={columns}
      onRowClick={onSelect ? (row) => onSelect(row.id) : undefined}
      rows={corpus.docs}
      selectedId={selectedId}
      testId={mini ? 'lens-document-mini' : 'lens-document'}
    />
  )
}

/**
 * Definition lens (C6): one row per variant definition, with its conditions, priority, how many documents have it,
 * and how many are missing it. Click a row to list the documents that miss it.
 */
export function DefinitionLens({corpus, definitions}: {corpus: Corpus; definitions: SystemVariant[]}) {
  const [selected, setSelected] = useState<string | null>(null)
  const rows = useMemo(
    () =>
      definitions.map((v) => {
        const id = shortId(v._id)
        const having = corpus.docs.filter((d) => d.variantIds.includes(id))
        return {
          id,
          title: variantTitle(v),
          conditions: Object.entries(v.conditions)
            .map(([k, val]) => `${k}: ${val}`)
            .join(' · '),
          priority: v.priority ?? 0,
          having: having.length,
          missing: corpus.docs.length - having.length,
        }
      }),
    [corpus, definitions],
  )
  const missingDocs = selected ? corpus.docs.filter((d) => !d.variantIds.includes(selected)) : []
  const selectedRow = rows.find((r) => r.id === selected)

  return (
    <Stack gap={3}>
      <DataTable
        columns={[
          {key: 'title', title: 'Definition', width: 240, render: (r) => text(r.title), sort: (a, b) => a.title.localeCompare(b.title)},
          {key: 'conditions', title: 'Conditions', width: 300, render: (r) => muted(r.conditions)},
          {key: 'priority', title: 'Priority', width: 100, render: (r) => text(r.priority), sort: (a, b) => a.priority - b.priority},
          {key: 'having', title: 'Documents with it', width: 160, render: (r) => text(r.having), sort: (a, b) => a.having - b.having},
          {key: 'missing', title: 'Missing', width: 110, render: (r) => (r.missing ? text(r.missing) : muted('None')), sort: (a, b) => a.missing - b.missing},
        ]}
        onRowClick={(row) => setSelected(row.id === selected ? null : row.id)}
        rows={rows}
        selectedId={selected}
        testId="lens-definition"
      />
      {selectedRow ? (
        <Stack gap={2}>
          <Text size={1} weight="medium">
            Documents without {selectedRow.title} ({missingDocs.length})
          </Text>
          <DataTable
            columns={[
              {key: 'title', title: 'Document', width: 320, render: (r) => text(r.title)},
              {key: 'status', title: 'Base', width: 200, render: (r) => muted(r.published ? (r.draft ? 'Published + draft' : 'Published') : 'Draft only')},
            ]}
            empty="Every document has this variant."
            height={260}
            rows={missingDocs}
            testId="lens-definition-missing"
          />
        </Stack>
      ) : (
        <Text muted size={0}>
          Select a definition to list the documents that do not have it yet.
        </Text>
      )}
    </Stack>
  )
}

/** Dimension lens: each value of each dimension, with the definitions and documents that use it. */
export function DimensionLens({corpus, definitions, dimensions}: {corpus: Corpus; definitions: SystemVariant[]; dimensions: DimensionSpec[]}) {
  const rows = dimensions.flatMap((dimension) =>
    dimension.values.map(([key, title]) => {
      const defs = definitions.filter((v) => v.conditions[dimension.name] === key).map((v) => shortId(v._id))
      return {
        id: `${dimension.name}-${key}`,
        dimension: dimension.title,
        value: valueTitle(dimension, key),
        definitions: defs.length,
        documents: corpus.docs.filter((d) => d.variantIds.some((id) => defs.includes(id))).length,
        title,
      }
    }),
  )
  return (
    <DataTable
      columns={[
        {key: 'value', title: 'Value', width: 240, render: (r) => text(r.value), sort: (a, b) => a.value.localeCompare(b.value)},
        {key: 'dimension', title: 'Dimension', width: 200, render: (r) => muted(r.dimension)},
        {key: 'definitions', title: 'Definitions using it', width: 190, render: (r) => text(r.definitions), sort: (a, b) => a.definitions - b.definitions},
        {key: 'documents', title: 'Documents', width: 140, render: (r) => text(r.documents), sort: (a, b) => a.documents - b.documents},
      ]}
      empty="No dimensions yet."
      rows={rows}
      testId="lens-dimension"
    />
  )
}

/** The winner for an address: of the definitions whose conditions all match, the highest priority, then the most specific. */
function resolve(address: Record<string, string>, definitions: SystemVariant[]): SystemVariant | null {
  const matching = definitions.filter((v) => Object.entries(v.conditions).every(([k, val]) => address[k] === val))
  matching.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || Object.keys(b.conditions).length - Object.keys(a.conditions).length)
  return matching[0] ?? null
}

/** Resolution lens (computed): for sample addresses, which definition wins. Addresses come from the dimensions' values. */
export function ResolutionLens({definitions, dimensions}: {definitions: SystemVariant[]; dimensions: DimensionSpec[]}) {
  const addresses = useMemo(() => {
    const out: Record<string, string>[] = [{}]
    for (const d of dimensions) for (const [key] of d.values) out.push({[d.name]: key})
    // Pairs of the first value of each of the first three dimensions.
    const firsts = dimensions.slice(0, 3).map((d) => [d.name, d.values[0]?.[0]] as const)
    for (let i = 0; i < firsts.length; i++) {
      for (let j = i + 1; j < firsts.length; j++) out.push({[firsts[i][0]]: firsts[i][1], [firsts[j][0]]: firsts[j][1]})
    }
    return out
  }, [dimensions])
  const rows = addresses.map((address, i) => {
    const winner = resolve(address, definitions)
    return {
      id: `address-${i}`,
      address:
        Object.entries(address)
          .map(([k, v]) => {
            const dimension = dimensions.find((d) => d.name === k)
            return `${dimension?.title ?? k}: ${dimension ? valueTitle(dimension, v) : v}`
          })
          .join(' · ') || 'No address',
      winner: winner ? variantTitle(winner) : 'The base document',
    }
  })
  return (
    <DataTable
      columns={[
        {key: 'address', title: 'Address', width: 380, render: (r) => text(r.address)},
        {key: 'winner', title: 'Resolves to', width: 320, render: (r) => muted(r.winner)},
      ]}
      rows={rows}
      testId="lens-resolution"
    />
  )
}

/** Release lens (C8): one row per release, with its type, state, schedule and how many versions it holds. */
export function ReleaseLens({corpus}: {corpus: Corpus}) {
  const rows = corpus.releases.map((r) => ({
    id: r.id,
    title: r.title ?? r.id,
    type: r.type ?? 'undecided',
    state: r.state ?? '',
    at: r.at ?? '',
    docs: corpus.releaseCounts[r.id]?.docs ?? 0,
    variants: corpus.releaseCounts[r.id]?.variants ?? 0,
  }))
  return (
    <DataTable
      columns={[
        {key: 'title', title: 'Release', width: 260, render: (r) => text(r.title), sort: (a, b) => a.title.localeCompare(b.title)},
        {key: 'type', title: 'Type', width: 130, render: (r) => muted(r.type)},
        {key: 'state', title: 'State', width: 130, render: (r) => muted(r.state)},
        {key: 'at', title: 'Publishes', width: 170, render: (r) => (r.at ? muted(dateLabel(r.at)) : muted('Not scheduled')), sort: (a, b) => (a.at < b.at ? -1 : 1)},
        {key: 'docs', title: 'Documents', width: 120, render: (r) => text(r.docs), sort: (a, b) => a.docs - b.docs},
        {key: 'variants', title: 'Variants', width: 110, render: (r) => text(r.variants), sort: (a, b) => a.variants - b.variants},
      ]}
      empty="No releases."
      rows={rows}
      testId="lens-release"
    />
  )
}

export function LensNote({children}: {children: ReactNode}) {
  return (
    <Box paddingBottom={1}>
      <Card padding={0}>
        <Flex>
          <Text muted size={0}>
            {children}
          </Text>
        </Flex>
      </Card>
    </Box>
  )
}
