import {ChevronLeftIcon} from '@sanity/icons'
import {Button, Card, Flex, CardProps, Heading, Text, Spinner} from '@sanity/ui'
import {omit} from 'lodash'
import React, {forwardRef, useCallback, useState} from 'react'
import {map} from 'rxjs/operators'
import {combineLatest} from 'rxjs'
import styled from 'styled-components'
import {WorkspaceSummary} from '../../../../config'
import {createHookFromObservableFactory} from '../../../../util'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {useWorkspaces} from '../../../workspaces'
import {WorkspacePreview} from './WorkspacePreview'

const RootCard = styled(Card).attrs({radius: 2, shadow: 1})`
  width: 300px;
`

const List = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`

const useWorkspaceAuthStates = createHookFromObservableFactory((workspaces: WorkspaceSummary[]) =>
  combineLatest(
    workspaces.map((workspace) =>
      // eslint-disable-next-line max-nested-callbacks
      workspace.auth.state.pipe(map((state) => [workspace.name, state] as const))
    )
  ).pipe(map((entries) => Object.fromEntries(entries)))
)

export const WorkspaceSwitcher = forwardRef((props: CardProps, ref: React.Ref<any>) => {
  const workspaces = useWorkspaces()
  const {activeWorkspace, setActiveWorkspace} = useActiveWorkspace()
  const [authStates] = useWorkspaceAuthStates(workspaces)

  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState<string | null>(null)
  const selectedWorkspace =
    workspaces.length === 1
      ? workspaces[0]
      : workspaces.find((workspace) => workspace.name === selectedWorkspaceName)
  const LoginComponent = selectedWorkspace?.auth?.LoginComponent

  const handleBack = useCallback(() => setSelectedWorkspaceName(null), [])

  if (!authStates) {
    return (
      <RootCard {...props} ref={ref}>
        <Flex
          justify="center"
          align="center"
          direction="column"
          gap={4}
          paddingX={4}
          style={{
            // this prevents layout shift after the loading finishes
            minHeight: workspaces.length * 48 /* item */ + 76 /* header */,
          }}
        >
          <Text muted>Loading…</Text>
          <Spinner muted />
        </Flex>
      </RootCard>
    )
  }

  if (workspaces.length === 1 && LoginComponent && selectedWorkspace) {
    return (
      <RootCard {...props} ref={ref}>
        <Flex direction="column">
          <LoginComponent
            {...omit(selectedWorkspace, ['type', '__internal'])}
            key={selectedWorkspaceName}
          />
        </Flex>
      </RootCard>
    )
  }

  return (
    <RootCard {...props} ref={ref}>
      {LoginComponent && selectedWorkspace ? (
        <Flex direction="column" style={{position: 'relative'}}>
          <Button
            style={{position: 'absolute', top: '0.5rem', left: '0.5rem'}}
            icon={ChevronLeftIcon}
            text="Workspaces"
            fontSize={1}
            padding={2}
            mode="bleed"
            onClick={handleBack}
          />
          <LoginComponent
            {...omit(selectedWorkspace, ['type', '__internal'])}
            key={selectedWorkspaceName}
          />
        </Flex>
      ) : (
        <Flex direction="column">
          <Flex justify="center" paddingX={4} paddingTop={4} marginBottom={2}>
            <Heading size={1} align="center" as="h1">
              Your Workspaces
            </Heading>
          </Flex>

          <Flex justify="center" paddingX={4} marginBottom={3}>
            <Button
              as="a"
              href="https://sanity.io/manage"
              target="_blank"
              rel="noreferrer"
              mode="ghost"
              fontSize={1}
              padding={2}
              text="Manage Projects"
            />
          </Flex>

          <List>
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
                <WorkspacePreview
                  key={workspace.name}
                  workspace={workspace}
                  state={state}
                  // eslint-disable-next-line react/jsx-no-bind
                  onSelectWorkspace={handleSelectWorkspace}
                />
              )
            })}
          </List>
        </Flex>
      )}
    </RootCard>
  )
})

WorkspaceSwitcher.displayName = 'WorkspaceSwitcher'
