import {type User} from '@sanity/types'
import {Card, PortalProvider, Text} from '@sanity/ui'
import {useState} from 'react'
import {Flex} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {UserAvatar} from '../../components/userAvatar/UserAvatar'
import {PresenceTooltip} from '../PresenceTooltip'
import {type FormNodePresence} from '../types'

function presenceFor(user: User): FormNodePresence {
  return {user, path: ['title'], sessionId: `session-${user.id}`, lastActiveAt: ''}
}

const ITEMS: FormNodePresence[] = [
  presenceFor({id: 'ada', displayName: 'Ada Lovelace'}),
  presenceFor({id: 'grace', displayName: 'Grace Hopper'}),
  presenceFor({id: 'linus', displayName: 'Linus Torvalds'}),
]

/**
 * Chromatic sentinel for the field-presence tooltip: one Flex row per user
 * (online avatar, display name) stacked without gaps. The tooltip portals into
 * the named `documentScrollElement`, which DocumentPanel registers in
 * production and this harness registers below the trigger so the open
 * tooltip has somewhere to render. Users are plain records (no fetch); the
 * CSF `play` hovers the trigger.
 */
export function PresenceTooltipStory() {
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const elements = portalElement ? {documentScrollElement: portalElement} : undefined

  return (
    <TestWrapper schemaTypes={[]}>
      <PortalProvider __unstable_elements={elements}>
        <Card padding={4}>
          <Text muted size={1} weight="medium">
            hover the avatars
          </Text>
          <Flex justifyContent="center" style={{paddingTop: 96, paddingBottom: 24}}>
            <PresenceTooltip items={ITEMS}>
              <div data-testid="presence-tooltip-trigger">
                <UserAvatar user={ITEMS[0].user} status="online" />
              </div>
            </PresenceTooltip>
          </Flex>
          <div ref={setPortalElement} />
        </Card>
      </PortalProvider>
    </TestWrapper>
  )
}
