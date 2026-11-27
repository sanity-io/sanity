import {type User} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {styled} from 'styled-components'
import {Text, Box, Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {UserAvatar} from '../../../../../components/userAvatar/UserAvatar'
import {LoginProviderLogo} from '../LoginProviderLogo'

const ada: User = {id: 'ada', displayName: 'Ada Lovelace', email: 'ada@example.com'}

// Same host the user menu uses so the overlay docks at bottom-right of a
// size-2 avatar. Copied rather than exported — AvatarBox is local to UserMenu.
const AvatarBox = styled(Box)`
  position: relative;
  min-width: ${({theme}) => theme.sanity.avatar.sizes[2].size /* oxlint-disable-line no-deprecated -- will fix in follow up PR */}px;
  min-height: ${({theme}) => theme.sanity.avatar.sizes[2].size /* oxlint-disable-line no-deprecated -- will fix in follow up PR */}px;
`

function Row(props: {label: string; children: ReactNode}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {props.label}
      </Text>
      <Flex>{props.children}</Flex>
    </VStack>
  )
}

function AvatarWithProvider({provider}: {provider: string | undefined}) {
  return (
    <AvatarBox>
      <UserAvatar size={2} user={ada} />
      {provider ? <LoginProviderLogo provider={provider} /> : null}
    </AvatarBox>
  )
}

/**
 * Chromatic sentinel for the login-provider overlay on the navbar user avatar.
 * UserMenu's browser test uses a mock user with no provider, so the overlay
 * never paints there. TypeScript will not catch the 18px badge docking, the
 * GitHub/SAML fill that follows the card foreground, or the empty circle when
 * the provider is unknown. Fixture user — no live session.
 */
export function LoginProviderLogoStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <Row label="google">
            <AvatarWithProvider provider="google" />
          </Row>
          <Row label="github">
            <AvatarWithProvider provider="github" />
          </Row>
          <Row label="sanity">
            <AvatarWithProvider provider="sanity" />
          </Row>
          <Row label="saml">
            <AvatarWithProvider provider="saml-okta" />
          </Row>
          <Row label="unknown provider">
            <AvatarWithProvider provider="unknown" />
          </Row>
          <Row label="no provider">
            <AvatarWithProvider provider={undefined} />
          </Row>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
