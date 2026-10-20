import {Badge, Box, Card, Flex, Select, Stack, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'

import {StateDot, type StateKind} from '../c3/StateGlyph'
import {type DimensionSpec, type SystemVariant, valueTitle} from '../c1/model'
import {usePerspectiveState} from '../c1/state'
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {type Column, DataTable} from './DataTable'
import {DECLARED_VALUES} from './dimensionConfig'
import {ResolutionSamples} from './Lenses'
import {useOpenVersion} from './openVersion'
import {type Corpus, type DocRow} from './useCorpus'

// The two lenses that only exist at the GA stage (the Open beta lens switch keeps Document and Definition).
//  - Dimension: a coverage matrix. One row per document, one column per definition of the chosen dimension.
//  - Visitor: for the visitor chosen in the perspective bar, what each document serves, why, and what else exists.

const shortId = (id: string) => id.replace(/^_\.variants\./, '')
const definitionTitle = (v: SystemVariant) => v.metadata?.title ?? shortId(v._id)
const text = (value: string) => <Text size={1}>{value}</Text>
const muted = (value: string) => (
  <Text muted size={1}>
    {value}
  </Text>
)

const STATE_WORD: Record<StateKind, string> = {published: 'published', draft: 'draft', release: 'in a release', absent: 'no version'}

/** The most advanced state of a document's versions for one definition: published, then draft, then release. */
function stateOf(doc: DocRow, variantId: string): StateKind {
  const rows = doc.list.filter((r) => r.variantId === variantId)
  if (rows.some((r) => r.bundle === 'published')) return 'published'
  if (rows.some((r) => r.bundle === 'drafts')) return 'draft'
  return rows.length ? 'release' : 'absent'
}

interface MatrixRow {
  id: string
  summary?: boolean
  doc?: DocRow
}

/**
 * Dimension lens (GA): a coverage matrix. One row per document, one column per definition that uses the chosen dimension
 * (cells: published, draft, in a release, no version), a summary row with "n of m documents", and one empty column for
 * each declared value that has no definition yet. Declared values come from a FIXTURE (./dimensionConfig.ts): there is
 * no dimension config on the server. Read only; a column header or a cell opens the Definition lens for that definition.
 */
export function DimensionMatrix(props: {
  corpus: Corpus
  definitions: SystemVariant[]
  dimensions: DimensionSpec[]
  onOpenDefinition: (variantId: string) => void
}) {
  const {corpus, definitions, dimensions, onOpenDefinition} = props
  const [chosen, setChosen] = useState<string | null>(null)
  const dimension = dimensions.find((d) => d.name === chosen) ?? dimensions[0]
  const total = corpus.docs.length

  const columnsOf = useMemo(() => {
    if (!dimension) return {authored: [] as SystemVariant[], declared: [] as (readonly [string, string])[]}
    const authored = definitions
      .filter((v) => dimension.name in v.conditions)
      .sort((a, b) => valueTitle(dimension, a.conditions[dimension.name]).localeCompare(valueTitle(dimension, b.conditions[dimension.name])) || definitionTitle(a).localeCompare(definitionTitle(b)))
    const used = new Set(authored.map((v) => v.conditions[dimension.name]))
    const declared = (DECLARED_VALUES[dimension.name] ?? []).filter(([key]) => !used.has(key))
    return {authored, declared}
  }, [definitions, dimension])

  if (!dimension) return muted('No dimensions yet.')

  const covered = (variantId: string) => corpus.docs.filter((d) => stateOf(d, variantId) !== 'absent').length
  const anyCovered = corpus.docs.filter((d) => columnsOf.authored.some((v) => stateOf(d, shortId(v._id)) !== 'absent')).length

  const rows: MatrixRow[] = [{id: 'coverage', summary: true}, ...corpus.docs.map((doc) => ({id: doc.id, doc}))]
  const columns: Column<MatrixRow>[] = [
    {
      key: 'document',
      title: 'Document',
      width: 280,
      render: (r) => (r.summary ? <Text size={1} weight="medium">Coverage</Text> : text(r.doc!.title)),
    },
    ...columnsOf.authored.map<Column<MatrixRow>>((v) => {
      const id = shortId(v._id)
      return {
        key: id,
        title: definitionTitle(v),
        width: 150,
        header: (
          <Button data-testid={`lens-dimension-col-${id}`} mode="bleed" onClick={() => onOpenDefinition(id)} text={definitionTitle(v)} tooltipProps={{content: 'Open the Definition lens for this definition'}} />
        ),
        render: (r) =>
          r.summary ? (
            muted(`${covered(id)} of ${total}`)
          ) : (
            <Button
              data-testid={`lens-dimension-cell-${r.id}-${id}`}
              icon={<StateDot kind={stateOf(r.doc!, id)} />}
              mode="bleed"
              onClick={() => onOpenDefinition(id)}
              tooltipProps={{content: `${r.doc!.title} · ${definitionTitle(v)}: ${STATE_WORD[stateOf(r.doc!, id)]}. Open the Definition lens.`}}
            />
          ),
      }
    }),
    ...columnsOf.declared.map<Column<MatrixRow>>(([key, title]) => ({
      key: `declared-${key}`,
      title,
      width: 150,
      header: (
        <Stack data-testid={`lens-dimension-col-declared-${key}`} gap={1}>
          <Text muted size={1}>
            {title}
          </Text>
          <Text muted size={0}>
            no definition yet
          </Text>
        </Stack>
      ),
      render: (r) => (r.summary ? muted(`0 of ${total}`) : muted('·')),
    })),
  ]

  return (
    <Stack data-testid="dimension-matrix" gap={3}>
      <Flex align="center" gap={3} wrap="wrap">
        <Text muted size={1}>
          Dimension
        </Text>
        <Select data-testid="dimension-picker" fontSize={1} onChange={(e) => setChosen(e.currentTarget.value)} value={dimension.name}>
          {dimensions.map((d) => (
            <option key={d.name} value={d.name}>
              {d.title}
            </option>
          ))}
        </Select>
        <Text data-testid="dimension-summary" muted size={1}>
          {columnsOf.authored.length} {columnsOf.authored.length === 1 ? 'definition' : 'definitions'}; {anyCovered} of {total} documents have at least one.
          {columnsOf.declared.length ? ` ${columnsOf.declared.length} declared ${columnsOf.declared.length === 1 ? 'value has' : 'values have'} no definition yet.` : ''}
        </Text>
        {columnsOf.declared.length ? (
          <Badge data-testid="dimension-fixture" tone="caution">
            Fixture: declared values need a server-side dimension config
          </Badge>
        ) : null}
      </Flex>
      <DataTable columns={columns} empty="No documents." rows={rows} testId="lens-dimension" />
    </Stack>
  )
}

/** The winner for a visitor: the matching definitions, highest priority first, then the most specific. */
function matching(visitor: Record<string, string>, definitions: SystemVariant[]): SystemVariant[] {
  return definitions
    .filter((v) => Object.entries(v.conditions).every(([k, val]) => visitor[k] === val))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || Object.keys(b.conditions).length - Object.keys(a.conditions).length)
}

/**
 * Visitor lens (GA): for the visitor chosen in the perspective bar (the panel never asks for its own visitor), per
 * document: what is served, why (which definition, at which rank) and what else exists. RESOLUTION IS COMPUTED IN THIS
 * BROWSER from the stored definitions and versions: no resolution API exists, so this is a model of the rule (highest
 * priority published match wins, otherwise the base document), not the real delivery result.
 */
export function VisitorResolution(props: {corpus: Corpus; definitions: SystemVariant[]; dimensions: DimensionSpec[]}) {
  const {corpus, definitions, dimensions} = props
  const {chosen: visitor} = usePerspectiveState()
  const openVersion = useOpenVersion()
  const meets = matching(visitor, definitions)
  const label = Object.entries(visitor)
    .map(([k, v]) => {
      const d = dimensions.find((x) => x.name === k)
      return `${d?.title ?? k}: ${d ? valueTitle(d, v) : v}`
    })
    .join(' · ')

  const rows = corpus.docs.map((doc) => {
    const served = meets.find((v) => doc.list.some((r) => r.variantId === shortId(v._id) && r.bundle === 'published'))
    const unpublished = !served ? meets.find((v) => doc.list.some((r) => r.variantId === shortId(v._id))) : undefined
    const others = doc.list
      .filter((r) => (r.variantId ? meets.some((v) => shortId(v._id) === r.variantId) && r.variantId !== (served && shortId(served._id)) : false) || (served && !r.variantId && r.bundle === 'published'))
      .map((r) => {
        const def = r.variantId ? definitions.find((v) => shortId(v._id) === r.variantId) : undefined
        const state = r.bundle === 'published' ? 'published' : r.bundle === 'drafts' ? 'draft' : 'in a release'
        return `${def ? definitionTitle(def) : 'Base document'} · ${state}`
      })
    return {
      id: doc.id,
      type: doc.type,
      title: doc.title,
      servedId: served ? shortId(served._id) : null,
      kind: (served ? 'published' : 'absent') as StateKind,
      served: served ? definitionTitle(served) : 'Base document',
      why: served
        ? `Priority ${served.priority ?? 0}${meets.length > 1 ? `, beats ${meets.length - 1} other matching ${meets.length === 2 ? 'definition' : 'definitions'}` : ''}`
        : unpublished
          ? `${definitionTitle(unpublished)} exists but is not published`
          : meets.length
            ? 'No matching definition has a version of this document'
            : 'No definition matches this visitor',
      others: others.length ? others.join(' · ') : 'Nothing else',
    }
  })

  return (
    <Stack data-testid="visitor-resolution" gap={3}>
      <Flex align="center" gap={3} wrap="wrap">
        <Text size={1} weight="medium">
          Visitor: {label || 'anyone'}
        </Text>
        <Text muted size={1}>
          {label ? 'Set in the perspective bar.' : 'No visitor is chosen. Choose one in the perspective bar (View as…) to see who is served what.'}
        </Text>
        <Badge data-testid="visitor-computed" tone="caution">
          Computed in this browser; no resolution API exists
        </Badge>
      </Flex>
      <DataTable
        columns={[
          {key: 'title', title: 'Document', width: 280, render: (r) => text(r.title), sort: (a, b) => a.title.localeCompare(b.title)},
          {
            key: 'served',
            title: 'Served',
            width: 220,
            render: (r) => (
              <Flex align="center" gap={2}>
                <StateDot kind={r.kind} />
                <Text size={1}>{r.served}</Text>
              </Flex>
            ),
          },
          {key: 'why', title: 'Why', width: 320, render: (r) => muted(r.why)},
          {key: 'others', title: 'Could be served', width: 380, render: (r) => muted(r.others)},
          {key: 'open', title: '', width: 120, render: (r) => <Button mode="bleed" onClick={() => openVersion(r.id, r.type, r.servedId, 'published')} text="Open" />},
        ]}
        rows={rows}
        testId="lens-visitor"
      />
      <Box>
        <Card padding={0}>
          <ResolutionSamples definitions={definitions} dimensions={dimensions} />
        </Card>
      </Box>
    </Stack>
  )
}
