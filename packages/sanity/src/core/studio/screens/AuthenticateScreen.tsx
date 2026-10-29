import {Card} from '@sanity/ui'
import {Flex} from 'ui5'

import {WorkspaceAuth} from '../components/navbar/workspace/WorkspaceAuth/WorkspaceAuth'
import {LoggedOutToast} from './LoggedOutToast'

export function AuthenticateScreen() {
  return (
    <Card height="fill" overflow="auto" paddingX={4}>
      {/* Fires a toast if the studio logged the user out (e.g. expired session) */}
      <LoggedOutToast />
      <Flex
        height="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        paddingTop={4}
      >
        <WorkspaceAuth />
      </Flex>
    </Card>
  )
}
