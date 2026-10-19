import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {useState} from 'react'

import {useDimensions, useVariantDefinitions} from '../c1/world'
import {LiveInventory} from '../c4/inventory/LiveInventory'
import {DefinitionLens, DimensionLens, DocumentLens, ReleaseLens, ResolutionLens} from './Lenses'
import {useCorpus} from './useCorpus'

type Lens = 'document' | 'definition' | 'dimension' | 'resolution'

const LENSES: {id: Lens; label: string; hint: string}[] = [
  {id: 'document', label: 'Documents', hint: 'One row per document: versions, variants, releases.'},
  {id: 'definition', label: 'Definitions', hint: 'One row per variant definition, with the documents that miss it.'},
  {id: 'dimension', label: 'Dimensions', hint: 'Each dimension value, with the definitions and documents that use it.'},
  {id: 'resolution', label: 'Resolution', hint: 'Computed: which definition wins for a sample address.'},
]

const LOADING = (
  <Text muted size={1}>
    Loading the table…
  </Text>
)

function Segment<T extends string>(props: {value: T; options: {id: T; label: string}[]; onChange: (id: T) => void; label: string}) {
  return (
    <Flex aria-label={props.label} gap={1} role="radiogroup">
      {props.options.map((option) => (
        <Button
          aria-checked={props.value === option.id}
          fontSize={1}
          key={option.id}
          mode={props.value === option.id ? 'default' : 'ghost'}
          onClick={() => props.onChange(option.id)}
          padding={2}
          role="radio"
          style={{height: 25}}
          text={option.label}
          tone={props.value === option.id ? 'primary' : 'default'}
        />
      ))}
    </Flex>
  )
}

/**
 * C5, the inventory table, on real data. Four lenses (documents, definitions, dimensions, resolution). The document
 * lens has a full width and a mini width (320px, the size it has next to a form). Option A: the table. Option B: the
 * table plus a flyout: a row opens that document's inventory (Andrej's panel) to the right.
 */
export function InventoryTable({option}: {option: 'a' | 'b'}) {
  const corpus = useCorpus()
  const definitions = useVariantDefinitions()
  const dimensions = useDimensions()
  const [lens, setLens] = useState<Lens>('document')
  const [mini, setMini] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const active = LENSES.find((l) => l.id === lens)

  const table = !corpus ? (
    LOADING
  ) : lens === 'document' ? (
    <DocumentLens corpus={corpus} mini={mini} onSelect={option === 'b' ? setSelected : undefined} selectedId={selected} />
  ) : lens === 'definition' ? (
    <DefinitionLens corpus={corpus} definitions={definitions} />
  ) : lens === 'dimension' ? (
    <DimensionLens corpus={corpus} definitions={definitions} dimensions={dimensions} />
  ) : (
    <ResolutionLens definitions={definitions} dimensions={dimensions} />
  )

  const flyoutDoc = option === 'b' && lens === 'document' && selected ? corpus?.docs.find((d) => d.id === selected) : undefined

  return (
    <Stack data-testid={`c5-${option}`} gap={3}>
      <Flex align="center" gap={3} wrap="wrap">
        <Segment label="Lens" onChange={setLens} options={LENSES} value={lens} />
        {lens === 'document' ? (
          <Segment
            label="Width"
            onChange={(id) => setMini(id === 'mini')}
            options={[
              {id: 'full', label: 'Full'},
              {id: 'mini', label: 'Mini · 320'},
            ]}
            value={mini ? 'mini' : 'full'}
          />
        ) : null}
      </Flex>
      <Text muted size={0}>
        {active?.hint}
        {option === 'b' && lens === 'document' ? ' Click a row to open its inventory in the flyout.' : ''}
      </Text>
      <Flex align="flex-start" gap={3}>
        <Box style={{flex: 1, minWidth: 0, maxWidth: mini ? 320 : undefined}}>{table}</Box>
        {flyoutDoc ? (
          <Card border data-testid="c5-flyout" radius={3} style={{flex: 'none', height: 520, overflow: 'auto', width: 360}}>
            <LiveInventory documentId={flyoutDoc.id} title={flyoutDoc.title} />
          </Card>
        ) : null}
      </Flex>
    </Stack>
  )
}

/** C6: the Variants tool is the definition lens. */
export function DefinitionsTool() {
  const corpus = useCorpus()
  const definitions = useVariantDefinitions()
  return corpus ? <DefinitionLens corpus={corpus} definitions={definitions} /> : LOADING
}

/** C8: the Releases tool is the release lens. */
export function ReleasesTool() {
  const corpus = useCorpus()
  return corpus ? <ReleaseLens corpus={corpus} /> : LOADING
}
