import {Box, Card, Flex, Stack} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {omit} from 'lodash'
import {AddIcon, ArrowLeftIcon, ChevronRightIcon} from '@sanity/icons'
import {Button} from '../../../../../ui-components'
import {LoadingBlock} from '../../../../../components/loadingBlock'
import {useActiveWorkspace} from '../../../../activeWorkspaceMatcher'
import {useWorkspaces} from '../../../../workspaces'
import {WorkspacePreview} from '../WorkspacePreview'
import {useWorkspaceAuthStates} from '../hooks'
import {WORKSPACES_DOCS_URL} from '../constants'
import {useTranslation} from '../../../../../i18n'
import {Layout} from './Layout'

export function WorkspaceAuth() {
  const workspaces = useWorkspaces()
  const {activeWorkspace, setActiveWorkspace} = useActiveWorkspace()
  const [authStates] = useWorkspaceAuthStates(workspaces)
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState<string | null>(
    activeWorkspace?.name || null,
  )
  const selectedWorkspace =
    workspaces.length === 1
      ? workspaces[0]
      : workspaces.find((workspace) => workspace.name === selectedWorkspaceName)
  const LoginComponent = selectedWorkspace?.auth?.LoginComponent

  const handleBack = useCallback(() => setSelectedWorkspaceName(null), [])
  const {t} = useTranslation()

  if (!authStates) return <LoadingBlock showText />

  if (LoginComponent && selectedWorkspace) {
    return (
      <Stack space={2}>
        {workspaces.length > 1 && (
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
              {...omit(selectedWorkspace, ['type', '__internal'])}
              key={selectedWorkspaceName}
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
        {workspaces.map((workspace) => {
          const authState = authStates[workspace.name]
          // eslint-disable-next-line no-nested-ternary
          const state = authState.authenticated
            ? 'logged-in'
            : workspace.auth.LoginComponent
              ? 'logged-out'
              : 'no-access'

          const handleSelectWorkspace = () => {
            if (state === 'logged-in' && workspace.name !== activeWorkspace.name) {
              setActiveWorkspace(workspace.name)
            }

            if (state === 'logged-out') {
              setSelectedWorkspaceName(workspace.name)
            }
          }

          return (
            <Card
              as="button"
              radius={2}
              key={workspace.name}
              padding={2}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={handleSelectWorkspace}
            >
              <WorkspacePreview
                icon={workspace?.icon}
                iconRight={ChevronRightIcon}
                state={state}
                subtitle={workspace?.subtitle}
                title={workspace?.title || workspace.name}
              />
            </Card>
          )
        })}
      </Stack>
    </Layout>
  )
}
