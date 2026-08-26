import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {Card, Stack, Text} from '@sanity/ui'

import {WorkspacePreview} from '../WorkspacePreview'

/**
 * Chromatic sentinel for the workspace switcher row after the ui5 Box
 * migration. The signed-out label is Box-padded next to title/icon
 * alignment; selected vs signed-out is a visual difference TypeScript
 * will not catch. Titles are fixtures (no live workspace names).
 */
export function WorkspacePreviewStory() {
  return (
    <Card padding={4} style={{maxWidth: 360}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            selected
          </Text>
          <WorkspacePreview icon={EarthGlobeIcon} selected title="Production" subtitle="blog" />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            signed out
          </Text>
          <WorkspacePreview icon={EarthGlobeIcon} state="logged-out" title="Staging" />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            no access
          </Text>
          <WorkspacePreview icon={EarthGlobeIcon} state="no-access" title="Private" />
        </Stack>
      </Stack>
    </Card>
  )
}
