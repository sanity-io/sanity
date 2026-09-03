import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {WorkspacePreview} from '../WorkspacePreview'

/**
 * Chromatic sentinel for the workspace preview row after the ui5 Box/Flex
 * migration, mirroring its two production callers: the login-screen header
 * (`WorkspaceAuth`: icon / title / subtitle) and the workspace auth card
 * (`WorkspaceAuthCard`: chevron `iconRight` plus `state`). The signed-out
 * label sits in a `Box paddingLeft={1}` next to the `Flex paddingLeft={3}
 * paddingRight={2}` chevron slot — the padding pairing this locks. Titles
 * are fixtures (no live workspace names); the transient loading state is
 * skipped.
 */
const meta = {
  title: 'Studio/Workspace Preview',
  component: WorkspacePreview,
} satisfies Meta<typeof WorkspacePreview>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  args: {title: 'Production'},
  render: () => (
    <Card padding={4} style={{maxWidth: 360}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            login header (icon, title, subtitle)
          </Text>
          <WorkspacePreview icon={EarthGlobeIcon} title="Production" subtitle="blog" />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            auth card, logged in (chevron)
          </Text>
          <WorkspacePreview
            icon={EarthGlobeIcon}
            iconRight={ChevronRightIcon}
            state="logged-in"
            subtitle="blog"
            title="Production"
          />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            auth card, signed out (label + chevron)
          </Text>
          <WorkspacePreview
            icon={EarthGlobeIcon}
            iconRight={ChevronRightIcon}
            state="logged-out"
            title="Staging"
          />
        </Stack>
      </Stack>
    </Card>
  ),
}
