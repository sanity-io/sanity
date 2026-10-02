import {LaunchIcon} from '@sanity/icons/Launch'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {Button, Card, Dialog, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {type DocumentFeature, type DocumentFeaturesResolver} from 'sanity'

function SpeciesFactSheetButton() {
  const [open, setOpen] = useState(false)
  const handleOpen = useCallback(() => setOpen(true), [])
  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <>
      <Button aria-label="Fact sheet" icon={SparklesIcon} mode="bleed" onClick={handleOpen} />
      {open && (
        <Dialog header="Fact sheet" id="species-fact-sheet" onClose={handleClose} width={1}>
          <Card padding={5}>
            <Text>A header feature that owns its own dialog state.</Text>
          </Card>
        </Dialog>
      )}
    </>
  )
}

const SPECIES_FACT_SHEET: DocumentFeature = {
  name: 'speciesFactSheet',
  toolbar: {placement: 'header', render: SpeciesFactSheetButton},
}

const SPECIES_WIKIPEDIA: DocumentFeature = {
  name: 'speciesWikipedia',
  toolbar: {
    placement: 'menu',
    title: 'Look up on Wikipedia',
    icon: LaunchIcon,
    shortcut: 'Ctrl+Alt+L',
    onAction: () => {
      window.open('https://en.wikipedia.org/wiki/Species', '_blank', 'noopener')
    },
  },
}

const SPECIES_KEPT = new Set<string>(['compareVersions', 'history'])

export const documentFeatures: DocumentFeaturesResolver = (prev, context) => {
  switch (context.schemaType) {
    case 'species':
      return [
        ...prev.filter((feature) => SPECIES_KEPT.has(feature.name)),
        SPECIES_FACT_SHEET,
        SPECIES_WIKIPEDIA,
      ]
    case 'house':
      return []
    default:
      return prev
  }
}
