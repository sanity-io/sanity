import {CogIcon} from '@sanity/icons/Cog'
import {PublishIcon} from '@sanity/icons/Publish'
import {type ButtonTone, Stack, TabList, Text} from '@sanity/ui'

import {Tab} from '../Tab'

const TONES: ButtonTone[] = ['default', 'primary', 'positive', 'caution', 'critical']

/**
 * Tone / icon / iconRight variants of the studio Tab wrapper. Padding and
 * font size are fixed, and `iconRight` is a studio-only extension — both
 * are easy to regress when migrating the Tab primitive to ui5.
 */
export function TabStory() {
  return (
    <Stack padding={4} gap={5}>
      <Stack gap={2}>
        <Text muted size={1} weight="medium">
          tones (first selected)
        </Text>
        <TabList gap={2}>
          {TONES.map((tone, index) => (
            <Tab
              key={tone}
              aria-controls="tab-panel"
              id={`tab-${tone}`}
              label={tone}
              selected={index === 0}
              tone={tone}
            />
          ))}
        </TabList>
      </Stack>
      <Stack gap={2}>
        <Text muted size={1} weight="medium">
          with icon
        </Text>
        <TabList gap={2}>
          {TONES.map((tone) => (
            <Tab
              key={tone}
              aria-controls="tab-panel"
              icon={PublishIcon}
              id={`tab-icon-${tone}`}
              label={tone}
              selected={tone === 'primary'}
              tone={tone}
            />
          ))}
        </TabList>
      </Stack>
      <Stack gap={2}>
        <Text muted size={1} weight="medium">
          iconRight (studio extension)
        </Text>
        <TabList gap={2}>
          <Tab
            aria-controls="tab-panel"
            iconRight={<CogIcon />}
            id="tab-icon-right"
            label="Settings"
            selected
          />
          <Tab aria-controls="tab-panel" id="tab-icon-right-idle" label="Content" />
        </TabList>
      </Stack>
    </Stack>
  )
}
