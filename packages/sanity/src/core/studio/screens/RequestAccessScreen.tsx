import {RequestAccessForm} from '@sanity/access-ui'
import {Card, Container, Flex} from '@sanity/ui'
import {useCallback} from 'react'
import {useSyncObservable} from 'react-rx'

import {LoadingBlock} from '../../components/loadingBlock/LoadingBlock'
import {useActiveWorkspace} from '../activeWorkspaceMatcher/useActiveWorkspace'

/**
 * Studio wiring around the shared request-access screen: resolves the client,
 * project id and current user from the active workspace's auth state, and
 * hands sign-out to the workspace auth store.
 *
 * @internal
 */
export function RequestAccessScreen() {
  const {activeWorkspace} = useActiveWorkspace()

  const handleSignOut = useCallback(() => {
    void activeWorkspace.auth.logout?.()
  }, [activeWorkspace])

  // Kept synchronous (`useSyncObservable`): the client read here feeds the
  // access-request POST, so a deferred snapshot could submit against a stale
  // workspace identity.
  const auth = useSyncObservable(activeWorkspace.auth.state, null)
  const client = auth?.client
  const projectId = client?.config().projectId

  if (!client || !projectId) return <LoadingBlock />

  return (
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4}>
        <Container width={0}>
          <RequestAccessForm
            // Keyed by project so a same-project auth re-emission (new client
            // instance) keeps in-progress form state, while a project switch
            // refetches the caller's access requests.
            key={projectId}
            client={client}
            resourceId={projectId}
            currentUser={auth.currentUser ?? undefined}
            onSignOut={handleSignOut}
          />
        </Container>
      </Flex>
    </Card>
  )
}
