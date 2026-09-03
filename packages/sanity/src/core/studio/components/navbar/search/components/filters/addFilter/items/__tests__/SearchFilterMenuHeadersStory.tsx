import {Card, Stack, Text} from '@sanity/ui'

import {type FilterMenuItemHeader} from '../../../../../types'
import {MenuItemHeader} from '../MenuItemHeader'

const DEFAULT_HEADER: FilterMenuItemHeader = {title: 'Document fields', type: 'header'}
const CAUTION_HEADER: FilterMenuItemHeader = {
  title: 'Deprecated fields',
  tone: 'caution',
  type: 'header',
}
const CRITICAL_HEADER: FilterMenuItemHeader = {
  title: 'Invalid filters',
  tone: 'critical',
  type: 'header',
}

/**
 * Chromatic sentinel for add-filter menu section headers after the ui5
 * Box migration. Default / caution / critical Card tones sit under
 * Box paddingTop — a mix TypeScript will not catch. Titles are fixtures.
 */
export function SearchFilterMenuHeadersStory() {
  return (
    <Card padding={4} style={{maxWidth: 320}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            default
          </Text>
          <MenuItemHeader item={DEFAULT_HEADER} />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            caution
          </Text>
          <MenuItemHeader item={CAUTION_HEADER} />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            critical
          </Text>
          <MenuItemHeader item={CRITICAL_HEADER} />
        </Stack>
      </Stack>
    </Card>
  )
}
