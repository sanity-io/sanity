import {Card} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import noop from 'lodash-es/noop.js'
import {type ReactNode} from 'react'
import {ActiveWorkspaceMatcherContext, VisibleWorkspacesContext} from 'sanity/_singletons'
import {Box, Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {GlobalStyle} from '../../../GlobalStyle'
import {resolveIcon} from '../../../manifest/icon'
import {AuthenticateScreen} from '../../../screens/AuthenticateScreen'
import {StudioErrorBoundary} from '../../../StudioErrorBoundary'
import {HomeButton} from '../home/HomeButton'
import {LoginProviderLogo} from '../userMenu/LoginProviderLogo'
import {WorkspaceAuth} from '../workspace/WorkspaceAuth/WorkspaceAuth'
import {WorkspaceAuthCard} from '../workspace/WorkspaceAuth/WorkspaceAuthCard'
import {createWorkspaceSummaries} from './workspaceSummaryFixtures'

const WORKSPACES = createWorkspaceSummaries([
  {
    name: 'production',
    title: 'Production',
    projectId: 'ppsg7ml5',
    dataset: 'production',
    subtitle: 'Live content',
  },
  {name: 'staging', title: 'Staging', projectId: 'abc123de', dataset: 'staging', signedIn: false},
])

const VISIBLE_WORKSPACES = {visibleWorkspaces: WORKSPACES, workspaceAuthStates: {}}
const ACTIVE_WORKSPACE = {activeWorkspace: WORKSPACES[0], setActiveWorkspace: noop}

const LOGIN_PROVIDERS = ['google', 'github', 'sanity', 'saml-okta']

const MANIFEST_ICON_THEME = buildTheme()
const MANIFEST_ICON_HTML = resolveIcon({
  title: 'Production',
  subtitle: 'blog',
  theme: MANIFEST_ICON_THEME,
})

function Section({children, title}: {children: ReactNode; title: string}) {
  return (
    <VStack gap={3}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {title}
      </Text>
      {children}
    </VStack>
  )
}

function ThrowingChild(): never {
  throw new Error('The story child failed on purpose')
}

/**
 * Harness for the navbar's home button, the workspace login chooser and the
 * auth screen, the login provider badges on the user avatar, the studio's
 * global stylesheet, the manifest icon renderer and the studio error
 * boundary's default fallback. Two workspace summaries built with
 * `prepareConfig`: the active one answers "signed in", the other "signed
 * out", so both `WorkspaceAuthCard` states render without a request. The
 * mock auth store has no `LoginComponent`, so `WorkspaceAuth` renders the
 * chooser branch.
 */
export function NavbarAuthChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <VisibleWorkspacesContext.Provider value={VISIBLE_WORKSPACES}>
        <ActiveWorkspaceMatcherContext.Provider value={ACTIVE_WORKSPACE}>
          <GlobalStyle />
          <Card padding={4} style={{maxWidth: 640}}>
            <VStack gap={6}>
              <Section title="home button">
                <Flex>
                  <HomeButton />
                </Flex>
              </Section>

              <Section title="login provider logos">
                <Flex gap={4}>
                  {LOGIN_PROVIDERS.map((provider) => (
                    <Card
                      key={provider}
                      border
                      radius="full"
                      style={{position: 'relative', width: 33, height: 33}}
                    >
                      <LoginProviderLogo provider={provider} />
                    </Card>
                  ))}
                </Flex>
              </Section>

              <Section title="manifest icon">
                <Flex>
                  <div dangerouslySetInnerHTML={{__html: MANIFEST_ICON_HTML ?? ''}} />
                </Flex>
              </Section>

              <Section title="workspace auth cards">
                <VStack gap={1}>
                  {WORKSPACES.map((workspace) => (
                    <WorkspaceAuthCard key={workspace.name} workspace={workspace} onSelect={noop} />
                  ))}
                </VStack>
              </Section>

              <Section title="workspace chooser">
                <WorkspaceAuth />
              </Section>

              <Section title="authenticate screen">
                <Card border style={{height: 360}}>
                  <AuthenticateScreen />
                </Card>
              </Section>

              <Section title="error boundary fallback">
                <Box style={{height: 320}}>
                  <StudioErrorBoundary heading="The story subtree failed">
                    <ThrowingChild />
                  </StudioErrorBoundary>
                </Box>
              </Section>
            </VStack>
          </Card>
        </ActiveWorkspaceMatcherContext.Provider>
      </VisibleWorkspacesContext.Provider>
    </TestWrapper>
  )
}
