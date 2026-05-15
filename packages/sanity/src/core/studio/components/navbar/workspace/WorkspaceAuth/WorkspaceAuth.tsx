import {AddIcon, ArrowLeftIcon} from '@sanity/icons'
import {Box, Flex, Stack} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Button} from '../../../../../../ui-components'
import {useTranslation} from '../../../../../i18n'
import {useActiveWorkspace} from '../../../../activeWorkspaceMatcher'
import {useVisibleWorkspaces} from '../../../../workspaces'
import {WORKSPACES_DOCS_URL} from '../constants'
import {WorkspacePreview} from '../WorkspacePreview'
import {Layout} from './Layout'
import {WorkspaceAuthCard} from './WorkspaceAuthCard'

export function WorkspaceAuth() {
  const {visibleWorkspaces} = useVisibleWorkspaces()
  const {activeWorkspace, setActiveWorkspace} = useActiveWorkspace()
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState<string | null>(
    activeWorkspace?.name || null,
  )
  const selectedWorkspace =
    visibleWorkspaces.length === 1
      ? visibleWorkspaces[0]
      : visibleWorkspaces.find((workspace) => workspace.name === selectedWorkspaceName)
  const LoginComponent = selectedWorkspace?.auth?.LoginComponent

  const handleBack = useCallback(() => setSelectedWorkspaceName(null), [])
  const {t} = useTranslation()

  const handleCardSelect = useCallback(
    (workspaceName: string, state: 'loading' | 'logged-in' | 'logged-out' | 'no-access') => {
      // While loading, navigate; the destination's auth boundary will handle login if needed.
      if (
        (state === 'logged-in' || state === 'loading') &&
        workspaceName !== activeWorkspace.name
      ) {
        setActiveWorkspace(workspaceName)
        return
      }

      if (state === 'logged-out') {
        setSelectedWorkspaceName(workspaceName)
      }
    },
    [activeWorkspace.name, setActiveWorkspace],
  )

  if (LoginComponent && selectedWorkspace) {
    return (
      <Stack space={2}>
        {visibleWorkspaces.length > 1 && (
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
          <Stack padding={2} paddingBottom={3} paddingTop={4}>
            <LoginComponent
              key={selectedWorkspaceName}
              projectId={selectedWorkspace.projectId}
              redirectPath={
                window.location.pathname.startsWith(selectedWorkspace.basePath)
                  ? // NOTE: the fragment cannot be preserved because it's used
                    // to transfer an sid to a token
                    `${window.location.pathname}${window.location.search}`
                  : selectedWorkspace.basePath
              }
            />
          </Stack>
        </Layout>
      </Stack>
    )
  }

  return (
    <Layout
      header={t('workspaces.choose-your-workspace-label')}
      footer={
        <Stack padding={1}>
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
        </Stack>
      }
    >
      <Stack space={1} paddingX={1} paddingY={2}>
        {visibleWorkspaces.map((workspace) => (
          <WorkspaceAuthCard
            key={workspace.name}
            workspace={workspace}
            onSelect={(state) => handleCardSelect(workspace.name, state)}
          />
        ))}
      </Stack>
    </Layout>
  )
}
