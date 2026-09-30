import {AddIcon} from '@sanity/icons/Add'
import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {rem} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback, useState} from 'react'
import {styled} from 'styled-components'
import {Container, Box, Flex, VStack} from 'ui5'

import {Button} from '../../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {useActiveWorkspace} from '../../../../activeWorkspaceMatcher/useActiveWorkspace'
import {useVisibleWorkspaces} from '../../../../workspaces/useVisibleWorkspaces'
import {WORKSPACES_DOCS_URL} from '../constants'
import {WorkspacePreview} from '../WorkspacePreview'
import {Layout} from './Layout'
import {WorkspaceAuthCard} from './WorkspaceAuthCard'

const StyledContainer = styled(Container)((props) => {
  const theme = getTheme_v2(props.theme)
  const {container} = theme
  return {
    width: 'auto',
    minWidth: rem(container[0]),
    minHeight: 0,
  }
})

export function WorkspaceAuth() {
  const {visibleWorkspaces} = useVisibleWorkspaces()
  const {activeWorkspace, setActiveWorkspace} = useActiveWorkspace()
  // The workspace we show the login for is always the active one, so its URL
  // (basePath) and the rendered login stay in sync. `showChooser` is the only
  // local UI state: whether the user is looking at the workspace picker instead
  // of the active workspace's login form.
  const [showChooser, setShowChooser] = useState(false)
  const {t} = useTranslation()

  const canChooseAnotherWorkspace = visibleWorkspaces.length > 1
  const selectedWorkspace = activeWorkspace
  const LoginComponent = selectedWorkspace?.auth?.LoginComponent

  const handleBack = useCallback(() => setShowChooser(true), [])

  const handleCardSelect = useCallback(
    (workspaceName: string, state: 'loading' | 'logged-in' | 'logged-out' | 'no-access') => {
      // While loading, navigate; the destination's auth boundary will handle login if needed.
      if (state === 'logged-in' || state === 'loading' || state === 'logged-out') {
        // Switch the active workspace so the URL reflects the chosen workspace.
        // For a logged-out workspace the AuthBoundary keeps us on this screen,
        // now scoped to (and showing the login for) the new workspace at its own
        // basePath, instead of leaving the URL pointing at the previous one.
        if (workspaceName !== activeWorkspace.name) {
          setActiveWorkspace(workspaceName)
        }
        setShowChooser(false)
      }
    },
    [activeWorkspace.name, setActiveWorkspace],
  )

  if (LoginComponent && selectedWorkspace && !showChooser) {
    return (
      <StyledContainer size={0}>
        <VStack gap={2}>
          {canChooseAnotherWorkspace && (
            <Flex>
              <Button
                icon={ArrowLeftIcon}
                mode="bleed"
                onClick={handleBack}
                text={t('workspaces.action.choose-another-workspace')}
              />
            </Flex>
          )}

          <Layout
            header={
              <Box padding={3}>
                <WorkspacePreview
                  icon={selectedWorkspace.icon}
                  title={selectedWorkspace.title}
                  subtitle={selectedWorkspace?.subtitle}
                />
              </Box>
            }
          >
            <Flex padding={2} paddingBottom={3} paddingTop={4} flexDirection="column">
              <LoginComponent
                key={selectedWorkspace.name}
                projectId={selectedWorkspace.projectId}
                redirectPath={
                  window.location.pathname.startsWith(selectedWorkspace.basePath)
                    ? // NOTE: the fragment cannot be preserved because it's used
                      // to transfer an sid to a token
                      `${window.location.pathname}${window.location.search}`
                    : selectedWorkspace.basePath
                }
                // Only offer switching when there's somewhere else to switch to.
                // Lets the login UI (e.g. the no-providers warning) route back to
                // the workspace chooser without a full reload.
                onChooseAnotherWorkspace={canChooseAnotherWorkspace ? handleBack : undefined}
              />
            </Flex>
          </Layout>
        </VStack>
      </StyledContainer>
    )
  }

  return (
    <StyledContainer size={1}>
      <Layout
        header={t('workspaces.choose-your-workspace-label')}
        footer={
          <Flex padding={1} flexDirection="column">
            <Button
              as="a"
              href={WORKSPACES_DOCS_URL}
              icon={AddIcon}
              mode="bleed"
              rel="noopener noreferrer"
              size="large"
              target="__blank"
              text={t('workspaces.action.add-workspace')}
            />
          </Flex>
        }
      >
        <Flex gap={1} paddingX={1} paddingY={2} flexDirection="column">
          {visibleWorkspaces.map((workspace) => (
            <WorkspaceAuthCard
              key={workspace.name}
              workspace={workspace}
              onSelect={(state) => handleCardSelect(workspace.name, state)}
            />
          ))}
        </Flex>
      </Layout>
    </StyledContainer>
  )
}
