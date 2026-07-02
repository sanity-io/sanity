import {Card, Flex} from '@sanity/ui'

import {WorkspaceAuth} from '../components/navbar/workspace'
import {LoggedOutToast} from './LoggedOutToast'

export function AuthenticateScreen() {
  return (
    <Card height="fill" overflow="auto" paddingX={4}>
      {/* Fires a toast if the studio logged the user out (e.g. expired session) */}
      <LoggedOutToast />
      <Flex height="fill" direction="column" align="center" justify="center" paddingTop={4}>
        <WorkspaceAuth />
      </Flex>
    </Card>
  )
}
