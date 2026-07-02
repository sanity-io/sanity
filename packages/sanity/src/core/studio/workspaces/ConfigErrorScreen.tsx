/* eslint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import {ArrowLeftIcon, LaunchIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Heading, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {useActiveWorkspace} from '../activeWorkspaceMatcher'
import {Layout} from '../components/navbar/workspace/WorkspaceAuth/Layout'
import {WorkspaceAuthCard} from '../components/navbar/workspace/WorkspaceAuth/WorkspaceAuthCard'
import {type ConfigErrorClassification} from '../requestErrors/classify'
import {useVisibleWorkspaces} from './useVisibleWorkspaces'

const CenteredContainer = styled(Flex)`
  min-height: 100vh;
  box-sizing: border-box;
`

const ContentWrapper = styled(Box)`
  width: 100%;
  max-width: 520px;
`

const HelpLink = styled.a`
  color: var(--card-link-fg-color);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25em;

  &:hover {
    text-decoration: underline;
  }
`

// Inline monospace for config-key names mentioned in prose (e.g.
// `projectId`). A plain <code> flows inline with text, unlike @sanity/ui's
// <Code>, which renders a block-level <pre> that breaks onto its own line.
const InlineCode = styled.code`
  font-family: var(--card-code-family, monospace);
  font-size: 0.9em;
  background: var(--card-code-bg-color);
  color: var(--card-code-fg-color);
  padding: 0.1em 0.35em;
  border-radius: 3px;
`

/** @internal */
export interface ConfigErrorScreenProps {
  error: ConfigErrorClassification
  /**
   * The failing workspace's projectId / dataset, read from its client
   * config (not parsed from the error). Used to name the missing resource
   * and deep-link into Manage.
   */
  projectId?: string
  dataset?: string
  isStaging: boolean
}

/**
 * Full-screen takeover for workspace configuration errors — the project
 * or dataset the studio points at doesn't exist. Unlike the request-error
 * dialog, there's no "Try again": the only path forward is fixing the
 * config (or creating the missing resource in Manage), so the screen links
 * straight to the relevant Manage page.
 *
 * @internal
 */
export function ConfigErrorScreen(props: ConfigErrorScreenProps): React.ReactElement {
  const {error, projectId, dataset, isStaging} = props
  const manageBaseUrl = isStaging ? 'https://sanity.work' : 'https://sanity.io'

  const {visibleWorkspaces} = useVisibleWorkspaces()
  const {activeWorkspace, setActiveWorkspace} = useActiveWorkspace()

  // Whether the user is looking at the workspace picker instead of the
  // error. Only offered when there's somewhere else to go.
  const canChooseAnotherWorkspace = visibleWorkspaces.length > 1
  const [showChooser, setShowChooser] = useState(false)

  const handleChoose = useCallback(() => setShowChooser(true), [])

  const handleSelectWorkspace = useCallback(
    (workspaceName: string) => {
      // Switching is a router navigation (no reload). If the chosen
      // workspace is itself misconfigured, its boot re-runs and lands back
      // on this screen scoped to it — but the user picked it explicitly,
      // rather than us guessing and risking a stuck loop.
      if (workspaceName !== activeWorkspace.name) setActiveWorkspace(workspaceName)
      setShowChooser(false)
    },
    [activeWorkspace.name, setActiveWorkspace],
  )

  if (showChooser) {
    return (
      <WorkspaceChooserScreen
        onBack={() => setShowChooser(false)}
        onSelect={handleSelectWorkspace}
      />
    )
  }

  const onChooseAnotherWorkspace = canChooseAnotherWorkspace ? handleChoose : undefined

  if (error.type === 'projectNotFound') {
    return (
      <ProjectNotFoundScreen
        projectId={projectId}
        manageBaseUrl={manageBaseUrl}
        onChooseAnotherWorkspace={onChooseAnotherWorkspace}
      />
    )
  }
  return (
    <DatasetNotFoundScreen
      projectId={projectId}
      dataset={dataset}
      manageBaseUrl={manageBaseUrl}
      onChooseAnotherWorkspace={onChooseAnotherWorkspace}
    />
  )
}

/**
 * Workspace picker, reusing the same card list the auth screen
 * (`WorkspaceAuth`) shows: each card probes its own auth state. Selecting
 * one switches the active workspace; "Back" returns to the error.
 */
function WorkspaceChooserScreen(props: {
  onBack: () => void
  onSelect: (workspaceName: string) => void
}) {
  const {onBack, onSelect} = props
  const {visibleWorkspaces} = useVisibleWorkspaces()
  const {t} = useTranslation()

  return (
    <Card
      data-testid="studio-error-screen"
      data-error="Config error workspace chooser"
      height="fill"
    >
      <CenteredContainer align="center" justify="center" padding={4}>
        <Container width={1}>
          <Stack space={2}>
            <Flex>
              <Button icon={ArrowLeftIcon} mode="bleed" onClick={onBack} text="Back" />
            </Flex>
            <Layout header={t('workspaces.choose-your-workspace-label')}>
              <Stack space={1} paddingX={1} paddingY={2}>
                {visibleWorkspaces.map((workspace) => (
                  <WorkspaceAuthCard
                    key={workspace.name}
                    workspace={workspace}
                    onSelect={() => onSelect(workspace.name)}
                  />
                ))}
              </Stack>
            </Layout>
          </Stack>
        </Container>
      </CenteredContainer>
    </Card>
  )
}

/** "Choose another workspace" button shown above the error heading. */
function ChooseAnotherWorkspaceButton(props: {onChooseAnotherWorkspace?: () => void}) {
  const {t} = useTranslation()
  if (!props.onChooseAnotherWorkspace) return null
  return (
    <Flex>
      <Button
        icon={ArrowLeftIcon}
        mode="bleed"
        onClick={props.onChooseAnotherWorkspace}
        text={t('workspaces.action.choose-another-workspace')}
      />
    </Flex>
  )
}

function ConfigErrorLayout(props: {
  errorLabel: string
  heading: string
  message: React.ReactNode
  hint: React.ReactNode
  details: React.ReactNode
  action: React.ReactNode
  onChooseAnotherWorkspace?: () => void
}) {
  return (
    <Card data-testid="studio-error-screen" data-error={props.errorLabel} height="fill">
      <CenteredContainer align="center" justify="center" padding={4}>
        <ContentWrapper paddingBottom={5}>
          <Stack space={4}>
            <ChooseAnotherWorkspaceButton
              onChooseAnotherWorkspace={props.onChooseAnotherWorkspace}
            />
            <Heading as="h1" size={2}>
              {props.heading}
            </Heading>
            <Text size={2} muted>
              {props.message}
            </Text>
            {props.details}
            <Text size={1} muted>
              {props.hint}
            </Text>
            <Flex paddingTop={2}>{props.action}</Flex>
            <DocsLink />
          </Stack>
        </ContentWrapper>
      </CenteredContainer>
    </Card>
  )
}

/** Labeled key/value rows for the configured project/dataset values. */
function ConfigDetails(props: {rows: Array<{label: string; value?: string}>}) {
  const rows = props.rows.filter((row): row is {label: string; value: string} => Boolean(row.value))
  if (rows.length === 0) return null
  return (
    <Card border radius={2} padding={3} tone="transparent">
      <Stack space={3}>
        {rows.map((row) => (
          <Stack key={row.label} space={2}>
            <Text size={0} muted weight="medium">
              {row.label}
            </Text>
            <Text size={1}>
              <InlineCode>{row.value}</InlineCode>
            </Text>
          </Stack>
        ))}
      </Stack>
    </Card>
  )
}

function ProjectNotFoundScreen(props: {
  projectId?: string
  manageBaseUrl: string
  onChooseAnotherWorkspace?: () => void
}) {
  const {projectId, manageBaseUrl, onChooseAnotherWorkspace} = props

  return (
    <ConfigErrorLayout
      errorLabel="Project not found"
      heading="Project not found"
      onChooseAnotherWorkspace={onChooseAnotherWorkspace}
      message={
        projectId ? (
          <>
            No project with the ID <InlineCode>{projectId}</InlineCode> exists, or you don&apos;t
            have access to it.
          </>
        ) : (
          "The Studio is configured for a project that doesn't exist, or that you don't have access to."
        )
      }
      details={null}
      hint={
        <>
          Check that the <InlineCode>projectId</InlineCode> in your Studio config is correct. You
          can find your project IDs in Manage.
        </>
      }
      action={
        <Button
          as="a"
          href={`${manageBaseUrl}/manage`}
          iconRight={LaunchIcon}
          rel="noopener noreferrer"
          size="large"
          target="_blank"
          text="Open Manage"
        />
      }
    />
  )
}

function DatasetNotFoundScreen(props: {
  projectId?: string
  dataset?: string
  manageBaseUrl: string
  onChooseAnotherWorkspace?: () => void
}) {
  const {projectId, dataset, manageBaseUrl, onChooseAnotherWorkspace} = props

  const datasetsUrl = useMemo(
    () =>
      projectId
        ? `${manageBaseUrl}/manage/project/${projectId}/datasets`
        : `${manageBaseUrl}/manage`,
    [manageBaseUrl, projectId],
  )

  return (
    <ConfigErrorLayout
      errorLabel="Dataset not found"
      heading="Dataset not found"
      onChooseAnotherWorkspace={onChooseAnotherWorkspace}
      message="The Studio is configured for a dataset that doesn't exist, or that you don't have access to."
      details={
        <ConfigDetails
          rows={[
            {label: 'Project ID', value: projectId},
            {label: 'Dataset', value: dataset},
          ]}
        />
      }
      hint={
        <>
          Check that the <InlineCode>dataset</InlineCode> in your Studio config is correct, or
          create it in Manage.
        </>
      }
      action={
        <Button
          as="a"
          href={datasetsUrl}
          iconRight={LaunchIcon}
          rel="noopener noreferrer"
          size="large"
          target="_blank"
          text="Manage datasets"
        />
      }
    />
  )
}

function DocsLink() {
  return (
    <Flex justify="flex-end" paddingTop={2}>
      <Text size={1}>
        <HelpLink
          href="https://www.sanity.io/docs/configuration"
          rel="noopener noreferrer"
          style={{textDecoration: 'none'}}
          target="_blank"
        >
          Studio configuration docs &rarr;
        </HelpLink>
      </Text>
    </Flex>
  )
}
