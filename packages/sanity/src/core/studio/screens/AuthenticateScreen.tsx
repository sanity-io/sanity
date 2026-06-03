import {Card, Flex} from '@sanity/ui'

import {WorkspaceAuth} from '../components/navbar/workspace'

export function AuthenticateScreen() {
  return (
    <Card height="fill" overflow="auto" paddingX={4}>
      <Flex height="fill" direction="column" align="center" justify="center" paddingTop={4}>
        <WorkspaceAuth />
      </Flex>
    </Card>
  )
}
