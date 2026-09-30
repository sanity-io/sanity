import {LaunchIcon} from '@sanity/icons/Launch'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {Button, Card, Dialog, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {type DocumentHeaderTool, type DocumentMenuTool, type DocumentToolsResolver} from 'sanity'

declare module 'sanity' {
  interface DocumentToolIds {
    speciesFactSheet: never
    speciesWikipedia: never
  }
}

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
            <Text>A header tool that owns its own dialog state.</Text>
          </Card>
        </Dialog>
      )}
    </>
  )
}

const SPECIES_FACT_SHEET: DocumentHeaderTool = {
  id: 'speciesFactSheet',
  placement: 'header',
  render: SpeciesFactSheetButton,
}

const SPECIES_WIKIPEDIA: DocumentMenuTool = {
  id: 'speciesWikipedia',
  placement: 'menu',
  title: 'Look up on Wikipedia',
  icon: LaunchIcon,
  shortcut: 'Ctrl+Alt+L',
  onAction: () => {
    window.open('https://en.wikipedia.org/wiki/Species', '_blank', 'noopener')
  },
}

export const documentTools: DocumentToolsResolver = (prev, context) => {
  switch (context.schemaType) {
    case 'species':
      return [
        ...prev.filter((tool) => tool.id === 'compareVersions'),
        SPECIES_FACT_SHEET,
        SPECIES_WIKIPEDIA,
      ]
    case 'house':
      return []
    default:
      return prev
  }
}
