/* oxlint-disable i18next/no-literal-string, @sanity/i18n/no-attribute-string-literals -- Diagnostics uses fixed English terminology so support and users see the same technical labels. */
import {Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  version as reactVersion,
} from 'react'

import {Button} from '../../../../../ui-components/button/Button'
import {Dialog} from '../../../../../ui-components/dialog/Dialog'
import {useClient} from '../../../../hooks/useClient'
import {SANITY_VERSION} from '../../../../version'
import {
  formatStudioDiagnostics,
  gatherStudioDiagnostics,
  type StudioDiagnostics,
  type StudioDiagnosticsOptions,
} from '../../../diagnostics'
import {
  getSchemaDiagnostics,
  getUniqueTargetCount,
} from '../../../diagnostics/getStudioConfigurationDiagnostics'
import {studioRequestPerformance} from '../../../diagnostics/requestPerformance'
import {useCopyToClipboard} from '../../../hooks/useCopyToClipboard'
import {useWorkspace} from '../../../workspace'
import {useWorkspaces} from '../../../workspaces/useWorkspaces'
import {DiagnosticsReport} from './DiagnosticsReport'

interface DiagnosticsDialogProps {
  onClose: () => void
}

/** @internal */
export function DiagnosticsDialog({onClose}: DiagnosticsDialogProps) {
  const toast = useToast()
  const dialogId = useId()
  const workspace = useWorkspace()
  const workspaces = useWorkspaces()
  const client = useClient({apiVersion: '2025-02-19'})
  const [diagnostics, setDiagnostics] = useState<StudioDiagnostics>()
  const [error, setError] = useState<string>()
  const initialDiagnosticsStartedRef = useRef(false)
  const requestIdRef = useRef(0)
  const [copiedText, copy] = useCopyToClipboard()

  const diagnosticsOptions = useMemo<StudioDiagnosticsOptions>(
    () => ({
      client,
      getRequestHistory: studioRequestPerformance.getSnapshot,
      schema: getSchemaDiagnostics(workspace.schema),
      studio: {
        basePath: workspace.basePath,
        dataset: workspace.dataset,
        projectId: workspace.projectId,
        reactVersion,
        uniqueTargetCount: getUniqueTargetCount(workspaces),
        version: SANITY_VERSION,
        workspaceCount: workspaces.length,
        workspaceName: workspace.name,
        workspaceTitle: workspace.title,
      },
      user: workspace.currentUser,
    }),
    [
      client,
      workspace.basePath,
      workspace.currentUser,
      workspace.dataset,
      workspace.name,
      workspace.projectId,
      workspace.schema,
      workspace.title,
      workspaces,
    ],
  )

  const startDiagnostics = useCallback(
    (requestId: number) => {
      gatherStudioDiagnostics(diagnosticsOptions).then(
        (result) => {
          if (requestId === requestIdRef.current) setDiagnostics(result)
        },
        (cause: unknown) => {
          if (requestId === requestIdRef.current) setError(formatError(cause))
        },
      )
    },
    [diagnosticsOptions],
  )

  useEffect(() => {
    if (initialDiagnosticsStartedRef.current) return
    initialDiagnosticsStartedRef.current = true

    const requestId = ++requestIdRef.current
    startDiagnostics(requestId)
  }, [startDiagnostics])

  const output = useMemo(
    () => (diagnostics ? formatStudioDiagnostics(diagnostics) : undefined),
    [diagnostics],
  )

  const handleCopy = useCallback(async () => {
    if (!output) return
    const copied = await copy(output)
    toast.push({
      status: copied ? 'success' : 'error',
      title: copied ? 'Diagnostics copied to clipboard' : 'Could not copy diagnostics',
    })
  }, [copy, output, toast])

  const handleRunAgain = useCallback(() => {
    const requestId = ++requestIdRef.current
    setDiagnostics(undefined)
    setError(undefined)

    startDiagnostics(requestId)
  }, [startDiagnostics])
  const isCopied = Boolean(output && copiedText === output)

  return (
    <Dialog
      bodyHeight="70vh"
      footer={{
        cancelButton: {text: 'Close'},
        confirmButton: {
          disabled: !output,
          onClick: handleCopy,
          text: isCopied ? 'Copied' : 'Copy output',
          tone: 'primary',
        },
      }}
      header="Studio diagnostics"
      id={dialogId}
      onClickOutside={onClose}
      onClose={onClose}
      width={2}
    >
      <Stack gap={4} height="fill">
        {!diagnostics && !error ? (
          <Flex align="center" direction="column" flex={1} gap={3} justify="center">
            <Spinner />
            <Text muted size={1}>
              Gathering diagnostics…
            </Text>
          </Flex>
        ) : null}

        {error ? (
          <Card padding={4} radius={2} tone="critical">
            <Stack gap={4}>
              <Text size={1}>Could not gather diagnostics: {error}</Text>
              <Flex>
                <Button mode="ghost" onClick={handleRunAgain} text="Run again" />
              </Flex>
            </Stack>
          </Card>
        ) : null}

        {diagnostics ? (
          <Card flex={1} overflow="auto" padding={3} radius={2} tone="transparent">
            <DiagnosticsReport diagnostics={diagnostics} onRunAgain={handleRunAgain} />
          </Card>
        ) : null}
      </Stack>
    </Dialog>
  )
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
