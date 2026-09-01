import {Card, Stack, Text} from '@sanity/ui'

import {Layout} from '../Layout'

const BODY = (
  <Card padding={4}>
    <Text size={1}>Sign in to continue</Text>
  </Card>
)

const FOOTER = (
  <Card padding={3} tone="transparent">
    <Text muted size={1}>
      Choose another workspace
    </Text>
  </Card>
)

/**
 * Chromatic sentinel for workspace login chrome after the ui5 Box
 * migration. String vs node headers change Box padding and Card border
 * seams; the footer slot does the same at the bottom. Copy is a fixture
 * (no live workspace titles, no timestamps).
 */
export function WorkspaceAuthLayoutStory() {
  return (
    <Card padding={4} style={{maxWidth: 420}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            string header
          </Text>
          <Layout header="Production">{BODY}</Layout>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            header and footer
          </Text>
          <Layout footer={FOOTER} header="Staging">
            {BODY}
          </Layout>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            no header
          </Text>
          <Layout>{BODY}</Layout>
        </Stack>
      </Stack>
    </Card>
  )
}
