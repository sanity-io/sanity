import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {Card, Stack, Text} from '@sanity/ui'
import {Box} from 'ui5'

import {WorkspacePreview} from '../../WorkspacePreview'
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

// The login screen (WorkspaceAuth) passes the workspace preview as a node
// header; this is the `typeof header === 'object'` Box branch.
const NODE_HEADER = (
  <Box padding={3}>
    <WorkspacePreview icon={EarthGlobeIcon} title="Production" subtitle="blog" />
  </Box>
)

/**
 * Chromatic sentinel for workspace login chrome after the ui5 Box
 * migration, mirroring both production callers: the workspace chooser
 * (string header, footer) and the login screen (node header with
 * WorkspacePreview). Header kind changes the Box padding and the borderTop
 * seam on the body Card; the footer slot does the same at the bottom. Copy
 * is a fixture (no live workspace titles, no timestamps).
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
            string header and footer (workspace chooser)
          </Text>
          <Layout footer={FOOTER} header="Staging">
            {BODY}
          </Layout>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            node header (login screen)
          </Text>
          <Layout header={NODE_HEADER}>{BODY}</Layout>
        </Stack>
      </Stack>
    </Card>
  )
}
