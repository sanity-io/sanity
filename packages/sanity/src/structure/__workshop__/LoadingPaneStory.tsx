import {Card, Stack, Text} from '@sanity/ui'

import {PaneLayout} from '../components/pane/PaneLayout'
import {LoadingPane} from '../panes/loading/LoadingPane'

export default function LoadingPaneStory() {
  return (
    <Stack space={3}>
      <Card padding={4} tone="positive">
        <Text align="center">
          Note: This is <em>intentionally</em> not resolving. We're testing the loading pane!
        </Text>
      </Card>
      <PaneLayout height="fill">
        <LoadingPane paneKey="loading" />
      </PaneLayout>
    </Stack>
  )
}
