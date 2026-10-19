import {Box, Button, Card, Flex, Select, Stack, Text} from '@sanity/ui'
import {type ReactNode, useMemo, useState} from 'react'
import {useRouter} from 'sanity/router'

import {type DimensionSpec, type SystemVariant, valueTitle} from '../c1/model'
import {usePerspectiveState} from '../c1/state'
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

/**
 * Dimension lens: each value of each dimension, with the definitions that use it and, per lifecycle state, how many
 * documents have a version of one of those definitions: published, draft, in a release.
 */
export function DimensionLens({corpus, definitions, dimensions}: {corpus: Corpus; definitions: SystemVariant[]; dimensions: DimensionSpec[]}) {
  const rows = dimensions.flatMap((dimension) =>
    dimension.values.map(([key]) => {
      const defs = definitions.filter((v) => v.conditions[dimension.name] === key).map((v) => shortId(v._id))
      const versions = corpus.docs.map((d) => d.list.filter((r) => r.variantId && defs.includes(r.variantId)))
      const count = (pick: (bundle: string) => boolean) => versions.filter((list) => list.some((r) => pick(r.bundle))).length
      return {
        id: `${dimension.name}-${key}`,
        dimension: dimension.title,
        value: valueTitle(dimension, key),
        definitions: defs.length,
        published: count((b) => b === 'published'),
        draft: count((b) => b === 'drafts'),
        release: count((b) => b !== 'published' && b !== 'drafts'),
        documents: versions.filter((list) => list.length > 0).length,
        total: corpus.docs.length,
      }
    }),
  )
  const num = (n: number) => (n ? text(n) : muted('0'))
  return (
    <DataTable
      columns={[
        {key: 'value', title: 'Value', width: 220, render: (r) => text(r.value), sort: (a, b) => a.value.localeCompare(b.value)},
        {key: 'dimension', title: 'Dimension', width: 150, render: (r) => muted(r.dimension)},
        {key: 'definitions', title: 'Definitions', width: 120, render: (r) => num(r.definitions), sort: (a, b) => a.definitions - b.definitions},
        {key: 'published', title: 'Published', width: 110, render: (r) => num(r.published), sort: (a, b) => a.published - b.published},
        {key: 'draft', title: 'Draft', width: 100, render: (r) => num(r.draft), sort: (a, b) => a.draft - b.draft},
        {key: 'release', title: 'In a release', width: 130, render: (r) => num(r.release), sort: (a, b) => a.release - b.release},
        {key: 'documents', title: 'Documents', width: 160, render: (r) => muted(`${r.documents} of ${r.total}`), sort: (a, b) => a.documents - b.documents},
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

/**
 * Visitor lens (computed): pick one visitor context (one value per dimension, "Anyone" by default); for every document,
 * which version that visitor is served and why. A document is served the highest-priority published variant whose
 * conditions the visitor meets; with none, the base document.
 */
export function VisitorLens({corpus, definitions, dimensions}: {corpus: Corpus; definitions: SystemVariant[]; dimensions: DimensionSpec[]}) {
  const [visitor, setVisitor] = useState<Record<string, string>>({})
  const address = usePerspectiveState()
  const router = useRouter()
  const meets = definitions
    .filter((v) => Object.entries(v.conditions).every(([k, val]) => visitor[k] === val))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || Object.keys(b.conditions).length - Object.keys(a.conditions).length)

  const rows = corpus.docs.map((doc) => {
    const served = meets.find((v) => doc.list.some((r) => r.variantId === shortId(v._id) && r.bundle === 'published'))
    const unpublished = !served ? meets.find((v) => doc.list.some((r) => r.variantId === shortId(v._id))) : undefined
    return {
      id: doc.id,
      title: doc.title,
      winner: served ? variantTitle(served) : 'The base document',
      grounds: served
        ? `Published, priority ${served.priority ?? 0}${meets.length > 1 ? `; beats ${meets.length - 1} other matching ${meets.length === 2 ? 'definition' : 'definitions'} by priority` : ''}`
        : unpublished
          ? `${variantTitle(unpublished)} exists but is not published`
          : meets.length
            ? 'No matching definition has a version of this document'
            : 'No definition matches this visitor',
    }
  })

  return (
    <Stack gap={3}>
      <Flex align="center" gap={3} wrap="wrap">
        <Text muted size={1}>
          Visitor
        </Text>
        {dimensions.map((d) => (
          <Flex align="center" gap={2} key={d.name}>
            <Text muted size={0}>
              {d.title}
            </Text>
            <Select
              fontSize={1}
              onChange={(e) => {
                const value = e.currentTarget.value
                setVisitor((prev) => {
                  const next = {...prev}
                  if (value) next[d.name] = value
                  else delete next[d.name]
                  return next
                })
              }}
              value={visitor[d.name] ?? ''}
            >
              <option value="">Anyone</option>
              {d.values.map(([key, title]) => (
                <option key={key} value={key}>
                  {title}
                </option>
              ))}
            </Select>
          </Flex>
        ))}
        <Box flex={1} />
        <Button
          fontSize={1}
          mode="ghost"
          onClick={() => {
            // The studio shows what this visitor is served: Published, with the matching definition as the variant,
            // and the address row set to the same values.
            address.setChosen(visitor)
            address.setRowShown(Object.keys(visitor).length > 0)
            // The sticky perspective params live in the URL, so one navigation sets the tool, the version and the variant.
            const variant = meets[0] ? `&variant=${shortId(meets[0]._id)}` : ''
            router.navigateUrl({path: `/structure/book?perspective=published${variant}`})
          }}
          padding={2}
          style={{height: 25}}
          text="Open in the studio as this visitor"
        />
      </Flex>
      <DataTable
        columns={[
          {key: 'title', title: 'Document', width: 300, render: (r) => text(r.title), sort: (a, b) => a.title.localeCompare(b.title)},
          {key: 'winner', title: 'Served', width: 240, render: (r) => text(r.winner)},
          {key: 'grounds', title: 'Grounds', width: 460, render: (r) => muted(r.grounds)},
        ]}
        rows={rows}
        testId="lens-visitor"
      />
      <ResolutionSamples definitions={definitions} dimensions={dimensions} />
    </Stack>
  )
}

/** Sample addresses: which definition wins for the empty address, each value, and pairs of the first values. */
function ResolutionSamples({definitions, dimensions}: {definitions: SystemVariant[]; dimensions: DimensionSpec[]}) {
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
