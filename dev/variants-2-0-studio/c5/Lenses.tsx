import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type ReactNode, useMemo} from 'react'

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

/** The winner for an address: of the definitions whose conditions all match, the highest priority, then the most specific. */
function resolve(address: Record<string, string>, definitions: SystemVariant[]): SystemVariant | null {
  const matching = definitions.filter((v) => Object.entries(v.conditions).every(([k, val]) => address[k] === val))
  matching.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || Object.keys(b.conditions).length - Object.keys(a.conditions).length)
  return matching[0] ?? null
}

/** Sample addresses: which definition wins for the empty address, each value, and pairs of the first values. */
export function ResolutionSamples({definitions, dimensions}: {definitions: SystemVariant[]; dimensions: DimensionSpec[]}) {
  const addresses = useMemo(() => {
    const out: Record<string, string>[] = [{}]
    for (const d of dimensions) for (const [key] of d.values) out.push({[d.name]: key})
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
    <Stack gap={2}>
      <Text muted size={0}>
        Sample addresses
      </Text>
      <DataTable
        columns={[
          {key: 'address', title: 'Address', width: 380, render: (r) => text(r.address)},
          {key: 'winner', title: 'Resolves to', width: 320, render: (r) => muted(r.winner)},
        ]}
        height={260}
        rows={rows}
        testId="lens-resolution"
      />
    </Stack>
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
