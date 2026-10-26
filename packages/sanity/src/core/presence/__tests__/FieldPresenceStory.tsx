import {type User} from '@sanity/types'
import {Card, PortalProvider} from '@sanity/ui'
import {type ReactNode, useMemo, useState} from 'react'
import {Text, Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {Button} from '../../../ui-components/button/Button'
import {FieldPresenceInner} from '../FieldPresence'
import {PresenceTooltip} from '../PresenceTooltip'
import {type FormNodePresence} from '../types'

const ada: User = {id: 'ada', displayName: 'Ada Lovelace', email: 'ada@example.com'}
const grace: User = {id: 'grace', displayName: 'Grace Hopper', email: 'grace@example.com'}
const alan: User = {id: 'alan', displayName: 'Alan Turing', email: 'alan@example.com'}
const katherine: User = {id: 'kat', displayName: 'Katherine Johnson', email: 'kat@example.com'}
const prince: User = {id: 'prince', displayName: 'Prince', email: 'prince@example.com'}

function presence(user: User): FormNodePresence {
  return {
    user,
    path: ['title'],
    sessionId: `session-${user.id}`,
    lastActiveAt: '2026-01-15T12:00:00.000Z',
  }
}

const ONE = [presence(ada)]
const THREE = [presence(ada), presence(grace), presence(alan)]
const FIVE = [...THREE, presence(katherine), presence(prince)]

function PresencePortal({children}: {children: ReactNode}) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const elements = useMemo(() => (element ? {documentScrollElement: element} : {}), [element])

  return (
    <PortalProvider __unstable_elements={elements}>
      <div ref={setElement} style={{minHeight: 200, position: 'relative'}}>
        {element ? children : null}
      </div>
    </PortalProvider>
  )
}

function Labelled({label, children}: {label: string; children: ReactNode}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {label}
      </Text>
      {children}
    </VStack>
  )
}

/**
 * Chromatic sentinel for field-header presence after the ui5 Text / Flex
 * migration. `FieldPresenceInner` stacks avatars and the overflow counter;
 * `PresenceTooltip` lists each user's avatar and display name in a named
 * document-scroll portal. Users are fixtures (no imageUrl, no user-store
 * lookup). Grid harness for the co-located Storybook CSF file.
 */
export function FieldPresenceStory({mode = 'states'}: {mode?: 'states' | 'tooltip'}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <PresencePortal>
        {mode === 'tooltip' ? (
          <Flex alignItems="center" justifyContent="center" style={{minHeight: 160}}>
            <PresenceTooltip items={THREE}>
              <Button mode="ghost" text="Who is here" />
            </PresenceTooltip>
          </Flex>
        ) : (
          <Card padding={4} style={{maxWidth: 360}}>
            <VStack gap={5}>
              <Labelled label="one">
                <FieldPresenceInner presence={ONE} />
              </Labelled>
              <Labelled label="three">
                <FieldPresenceInner presence={THREE} />
              </Labelled>
              <Labelled label="five with counter">
                <FieldPresenceInner presence={FIVE} />
              </Labelled>
            </VStack>
          </Card>
        )}
      </PresencePortal>
    </TestWrapper>
  )
}
