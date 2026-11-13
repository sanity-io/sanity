import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Flex, Text} from 'ui5'

import {TestWrapper} from '../../../../../../../../../test/browser/TestWrapper'
import {AgentChangesBadge} from '../AgentChangesBadge'
import {DraftBadge} from '../DraftBadge'
import {NavigationBadge} from '../NavigationBadge'
import {PublishedBadge} from '../PublishedBadge'

function handleNavigate() {
  return undefined
}

function Labelled(props: {label: string; testId: string; children: ReactNode}) {
  return (
    <Flex alignItems="flex-start" flexDirection="column" gap={2}>
      <Text as="div" muted size={1} trim={true} weight="medium">
        {props.label}
      </Text>
      <Flex alignItems="center" data-testid={props.testId} flexWrap="wrap" gap={2}>
        {props.children}
      </Flex>
    </Flex>
  )
}

const AGENT = {
  bundleId: 'agent-doug',
  display: {displayName: 'Proposed changes', tone: 'suggest' as const},
}

/**
 * Chromatic sentinel for the document-panel navigation chips: draft,
 * published and agent tones in inactive / active / selected states, plus a
 * long label. Avatars are fixture perspectives; no tooltip is opened.
 */
export function NavigationBadgesStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 520}}>
        <Flex alignItems="flex-start" flexDirection="column" gap={5}>
          <Labelled label="Draft" testId="navigation-badges-draft">
            <DraftBadge navigate={handleNavigate} state={{active: false, selected: false}} />
            <DraftBadge navigate={handleNavigate} state={{active: true, selected: false}} />
            <DraftBadge navigate={handleNavigate} state={{active: true, selected: true}} />
          </Labelled>
          <Labelled label="Published" testId="navigation-badges-published">
            <PublishedBadge navigate={handleNavigate} state={{active: false, selected: false}} />
            <PublishedBadge navigate={handleNavigate} state={{active: true, selected: false}} />
            <PublishedBadge navigate={handleNavigate} state={{active: true, selected: true}} />
          </Labelled>
          <Labelled label="Agent" testId="navigation-badges-agent">
            <AgentChangesBadge agent={{...AGENT, selected: false}} navigate={handleNavigate} />
            <AgentChangesBadge agent={{...AGENT, selected: true}} navigate={handleNavigate} />
          </Labelled>
          <Labelled label="Long label" testId="navigation-badges-long">
            <NavigationBadge
              active
              avatar="drafts"
              data-testid="document-panel-navigation-badge-long"
              onClick={handleNavigate}
              selected={false}
              text="Returning customers from the Nordic region"
              tone="caution"
            />
          </Labelled>
        </Flex>
      </Card>
    </TestWrapper>
  )
}
