import {Box, Flex, Stack, Text} from '@sanity/ui'
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {type ReactNode, useState} from 'react'

import {useDimensions, useVariantDefinitions} from '../c1/world'
import {DefinitionDocumentsLens, DocumentVersionsLens} from './ActionableLenses'
import {DimensionLens, ReleaseLens, VisitorLens} from './Lenses'
import {useCorpus} from './useCorpus'

type Lens = 'document' | 'definition' | 'dimension' | 'visitor'

const LENSES: {id: Lens; label: string; hint: string}[] = [
  {id: 'document', label: 'Document', hint: 'Pinned to one document: its stored versions, one per row.'},
  {id: 'definition', label: 'Definition', hint: 'Pinned to one variant definition: every document, with the grey rows that do not have it yet.'},
  {id: 'dimension', label: 'Dimension', hint: 'Each dimension value, with the definitions and documents that use it. Read only.'},
  {id: 'visitor', label: 'Visitor', hint: 'Computed: pick a visitor; for every document, which version they are served and why. Read only.'},
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
          key={option.id}
          mode={props.value === option.id ? 'default' : 'ghost'}
          onClick={() => props.onChange(option.id)}
          role="radio"
          text={option.label}
          tone={props.value === option.id ? 'primary' : 'default'}
        />
      ))}
    </Flex>
  )
}

/**
 * C5, the inventory table, on real data (Figma E5 3:5679): one table, four lenses. The Document and Definition lenses
 * write to the dataset (select rows, bulk bar, confirm dialog); Dimension and Visitor are read only for now.
 *  - Option A (I1): one surface with a "View by" switch; each lens has its pin picker.
 *  - Option B (I2): the lenses live at their pins, each in its own place, on the same table.
 */
export function InventoryTable({option}: {option: 'a' | 'b'}) {
  const corpus = useCorpus()
  const definitions = useVariantDefinitions()
  const dimensions = useDimensions()
  const [lens, setLens] = useState<Lens>('definition')
  const [mini, setMini] = useState(false)
  const [docPin, setDocPin] = useState<string | null>(null)
  const [variantPin, setVariantPin] = useState<string | null>(null)

  if (!corpus) return LOADING

  const docLens = (
    <DocumentVersionsLens corpus={corpus} definitions={definitions} docId={docPin ?? corpus.docs[0]?.id ?? ''} mini={mini} onPin={setDocPin} />
  )
  const definitionLens = <DefinitionDocumentsLens corpus={corpus} definitions={definitions} onPin={setVariantPin} variantId={variantPin} />
  const dimensionLens = <DimensionLens corpus={corpus} definitions={definitions} dimensions={dimensions} />
  const visitorLens = <VisitorLens corpus={corpus} definitions={definitions} dimensions={dimensions} />

  if (option === 'b') {
    const section = (title: string, hint: string, body: ReactNode) => (
      <Stack gap={2} key={title}>
        <Text size={1} weight="medium">
          {title}
        </Text>
        <Text muted size={0}>
          {hint}
        </Text>
        {body}
      </Stack>
    )
    return (
      <Stack data-testid="c5-b" gap={5}>
        {section('In the document: the Document lens', 'Mini beside the form (320), full as its own pane.', (
          <Stack gap={3}>
            <Segment label="Width" onChange={(id) => setMini(id === 'mini')} options={[{id: 'full', label: 'Full'}, {id: 'mini', label: 'Mini · 320'}]} value={mini ? 'mini' : 'full'} />
            <Box style={{maxWidth: mini ? 340 : undefined}}>{docLens}</Box>
          </Stack>
        ))}
        {section('In the Variants tool: the Definition lens', 'Pinned to a definition.', definitionLens)}
        {section('In the Variants tool: the Dimension lens', LENSES[2].hint, dimensionLens)}
        {section('In the preview: the Visitor lens', LENSES[3].hint, visitorLens)}
      </Stack>
    )
  }

  const active = LENSES.find((l) => l.id === lens)
  return (
    <Stack data-testid="c5-a" gap={3}>
      <Flex align="center" gap={3} wrap="wrap">
        <Text muted size={1}>
          View by
        </Text>
        <Segment label="View by" onChange={setLens} options={LENSES} value={lens} />
        {lens === 'document' ? (
          <Segment label="Width" onChange={(id) => setMini(id === 'mini')} options={[{id: 'full', label: 'Full'}, {id: 'mini', label: 'Mini · 320'}]} value={mini ? 'mini' : 'full'} />
        ) : null}
      </Flex>
      <Text muted size={0}>
        {active?.hint}
      </Text>
      <Box style={{maxWidth: lens === 'document' && mini ? 340 : undefined}}>
        {lens === 'document' ? docLens : lens === 'definition' ? definitionLens : lens === 'dimension' ? dimensionLens : visitorLens}
      </Box>
    </Stack>
  )
}

/** C6: the Variants tool is the definition lens. */
export function DefinitionsTool() {
  const corpus = useCorpus()
  const definitions = useVariantDefinitions()
  const [pin, setPin] = useState<string | null>(null)
  return corpus ? <DefinitionDocumentsLens corpus={corpus} definitions={definitions} onPin={setPin} variantId={pin} /> : LOADING
}

/** C8: the Releases tool is the release lens. */
export function ReleasesTool() {
  const corpus = useCorpus()
  return corpus ? <ReleaseLens corpus={corpus} /> : LOADING
}
