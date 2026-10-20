import {Box, Flex, Stack, Text} from '@sanity/ui'
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {type ReactNode, useState} from 'react'

import {useDimensions, useVariantDefinitions} from '../c1/world'
import {useOptionState} from '../options/store'
import {DefinitionDocumentsLens, DocumentVersionsLens} from './ActionableLenses'
import {DimensionMatrix, VisitorResolution} from './GaLenses'
import {ReleaseLens} from './Lenses'
import {useCorpus} from './useCorpus'

type Lens = 'document' | 'definition' | 'dimension' | 'visitor'

const LENSES: {id: Lens; label: string; hint: string}[] = [
  {id: 'document', label: 'Document', hint: 'Pinned to one document: its stored versions, one per row.'},
  {id: 'definition', label: 'Definition', hint: 'Pinned to one variant definition: every document, with the grey rows that do not have it yet.'},
  {id: 'dimension', label: 'Dimension', hint: 'GA. One row per document, one column per definition of a dimension: where each is published, in draft or in a release. Read only.'},
  {id: 'visitor', label: 'Visitor', hint: 'GA. Computed in this browser for the visitor chosen in the perspective bar: what each document serves, why, and what else exists. Read only.'},
]

/** The lens switch follows the stage control of the Design options window: Open beta keeps Document and Definition, GA shows all four. */
const GA_ONLY: Lens[] = ['dimension', 'visitor']

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
 * C5, the inventory table, on real data (Figma E5 3:5679): one table, four lenses (Dimension and Visitor at the GA stage only). The Document and Definition lenses
 * write to the dataset (select rows, bulk bar, confirm dialog); Dimension and Visitor are read only for now.
 *  - Option A (I1): one surface with a "View by" switch; each lens has its pin picker.
 *  - Option B (I2): the lenses live at their pins, each in its own place, on the same table.
 */
export function InventoryTable({option}: {option: 'a' | 'b'}) {
  const corpus = useCorpus()
  const definitions = useVariantDefinitions()
  const dimensions = useDimensions()
  const {stage} = useOptionState()
  const [lens, setLens] = useState<Lens>('definition')
  const [mini, setMini] = useState(false)
  const [docPin, setDocPin] = useState<string | null>(null)
  const [variantPin, setVariantPin] = useState<string | null>(null)

  if (!corpus) return LOADING

  const docLens = (
    <DocumentVersionsLens corpus={corpus} definitions={definitions} docId={docPin ?? corpus.docs[0]?.id ?? ''} mini={mini} onPin={setDocPin} />
  )
  const definitionLens = <DefinitionDocumentsLens corpus={corpus} definitions={definitions} onPin={setVariantPin} variantId={variantPin} />
  const openDefinition = (variantId: string) => {
    setVariantPin(variantId)
    setLens('definition')
  }
  const dimensionLens = <DimensionMatrix corpus={corpus} definitions={definitions} dimensions={dimensions} onOpenDefinition={openDefinition} />
  const visitorLens = <VisitorResolution corpus={corpus} definitions={definitions} dimensions={dimensions} />
  const ga = stage === 'ga'
  const lenses = LENSES.filter((l) => ga || !GA_ONLY.includes(l.id))

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
        {ga ? section('In the Variants tool: the Dimension lens', LENSES[2].hint, dimensionLens) : null}
        {ga ? section('In the preview: the Visitor lens', LENSES[3].hint, visitorLens) : null}
      </Stack>
    )
  }

  // A lens that the stage does not offer falls back to Definition (the switch was on Dimension, then the stage went to Open beta).
  const shown: Lens = lenses.some((l) => l.id === lens) ? lens : 'definition'
  const active = lenses.find((l) => l.id === shown)
  return (
    <Stack data-testid="c5-a" gap={3}>
      <Flex align="center" gap={3} wrap="wrap">
        <Text muted size={1}>
          View by
        </Text>
        <Segment label="View by" onChange={setLens} options={lenses} value={shown} />
        {shown === 'document' ? (
          <Segment label="Width" onChange={(id) => setMini(id === 'mini')} options={[{id: 'full', label: 'Full'}, {id: 'mini', label: 'Mini · 320'}]} value={mini ? 'mini' : 'full'} />
        ) : null}
      </Flex>
      <Text muted size={0}>
        {active?.hint}
      </Text>
      <Box style={{maxWidth: shown === 'document' && mini ? 340 : undefined}}>
        {shown === 'document' ? docLens : shown === 'definition' ? definitionLens : shown === 'dimension' ? dimensionLens : visitorLens}
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
