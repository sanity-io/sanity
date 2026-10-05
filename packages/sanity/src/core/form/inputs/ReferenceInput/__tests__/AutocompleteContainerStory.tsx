import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {AutocompleteContainer} from '../AutocompleteContainer'

function FakeField({label}: {label: string}) {
  return (
    <Card border padding={3} radius={2} tone="transparent">
      <Text size={1}>{label}</Text>
    </Card>
  )
}

/**
 * Chromatic sentinel for the reference-input AutocompleteContainer after the
 * ui5 Grid migration. A 320px host is one column (`narrow`); a 640px host is
 * `1fr min-content` (`wide`). Fixture children only — no live autocomplete.
 */
export function AutocompleteContainerStory() {
  return (
    <Card padding={4}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            narrow
          </Text>
          <div data-testid="autocomplete-narrow" style={{width: 320}}>
            <AutocompleteContainer>
              <FakeField label="Search documents" />
              <FakeField label="Create new" />
            </AutocompleteContainer>
          </div>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            wide
          </Text>
          <div data-testid="autocomplete-wide" style={{width: 640}}>
            <AutocompleteContainer>
              <FakeField label="Search documents" />
              <FakeField label="Create new" />
            </AutocompleteContainer>
          </div>
        </VStack>
      </VStack>
    </Card>
  )
}
