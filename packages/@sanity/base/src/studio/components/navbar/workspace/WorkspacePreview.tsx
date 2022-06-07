import {HelpCircleIcon, ChevronRightIcon} from '@sanity/icons'
import {Flex, Box, Text, Card, Tooltip} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {WorkspaceSummary} from '../../../../config'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'

const StyledCard = styled(Card)`
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
`

const IconWrapper = styled(Box)`
  width: 32px;
  height: 32px;
  & > * {
    width: 100%;
  }
`

interface WorkspacePreviewProps {
  workspace: WorkspaceSummary
  state: 'logged-in' | 'logged-out' | 'no-access'
  onSelectWorkspace: () => void
}

export function WorkspacePreview({workspace, state, onSelectWorkspace}: WorkspacePreviewProps) {
  const {name, icon, title, subtitle, projectId, dataset} = workspace
  const {activeWorkspace} = useActiveWorkspace()
  const clickable = state === 'logged-in' || state === 'logged-out'

  return (
    <li>
      <StyledCard
        __unstable_focusRing
        {...(clickable
          ? {
              'data-as': 'button',
              forwardedAs: 'button',
              onClick: onSelectWorkspace,
            }
          : null)}
        padding={2}
        pressed={name === activeWorkspace.name}
      >
        <IconWrapper>{icon}</IconWrapper>
        <Flex direction="column" flex="auto" gap={2}>
          <Text weight="semibold">{title}</Text>
          <Text muted size={1}>
            {subtitle || (
              <>
                <span title={`Project ID: ${projectId}`}>{projectId}</span> |{' '}
                <span title={`Dataset: ${dataset}`}>{dataset}</span>
              </>
            )}
          </Text>
        </Flex>
        <Box flex="none" paddingRight={clickable ? 0 : 2}>
          <Text muted size={1}>
            {state === 'logged-in' && <>{/* intentionally blank */}</>}
            {state === 'logged-out' && <em>Signed out</em>}

            {state === 'no-access' && (
              <>
                <em>{<>No access&nbsp;&nbsp;</>}</em>
                <Tooltip
                  content={
                    <Card padding={2} style={{width: 128}}>
                      <Text size={1}>
                        You are signed out of this workspace and it is not configured for manual
                        sign in.
                      </Text>
                    </Card>
                  }
                >
                  <HelpCircleIcon />
                </Tooltip>
              </>
            )}
          </Text>
        </Box>

        {state === 'logged-out' && (
          <Box flex="none">
            <Text size={2}>
              <ChevronRightIcon />
            </Text>
          </Box>
        )}
      </StyledCard>
    </li>
  )
}
