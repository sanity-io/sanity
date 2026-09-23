import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type CardTone, Card, Stack, Text} from '@sanity/ui'

import {Banner} from '../Banner'

const TONES: CardTone[] = ['transparent', 'primary', 'caution', 'critical', 'suggest']

/**
 * Chromatic sentinel for ui5 Box padding on document-pane Banner chrome
 * (tones, icon, action). Static copy only. Shared with the co-located
 * Storybook CSF file.
 */
export function DocumentBannerStory() {
  return (
    <Card padding={4} style={{maxWidth: 560}}>
      <Stack gap={3}>
        {TONES.map((tone) => (
          <Stack key={tone} gap={2}>
            <Text muted size={1} weight="medium">
              tone="{tone}"
            </Text>
            <Banner
              action={{text: 'Review'}}
              content={<Text size={1}>Document has unpublished changes</Text>}
              icon={
                tone === 'caution' || tone === 'critical' ? WarningOutlineIcon : InfoOutlineIcon
              }
              tone={tone}
            />
          </Stack>
        ))}
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            content only
          </Text>
          <Banner content={<Text size={1}>Linked to Canvas</Text>} />
        </Stack>
      </Stack>
    </Card>
  )
}
