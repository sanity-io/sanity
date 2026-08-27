import {Box, Button, Card, Flex, Heading, Stack, Text, TextArea} from '@sanity/ui'
import {lazy, Suspense, type SyntheticEvent, useCallback, useId, useRef, useState} from 'react'

import {type StudioDiagnostics} from '../../../packages/sanity/src/core/studio/diagnostics/gatherStudioDiagnostics'
import {parseStudioDiagnostics} from './parseStudioDiagnostics'

const DiagnosticsReport = lazy(() =>
  import('../../../packages/sanity/src/core/studio/components/navbar/resources/DiagnosticsReport').then(
    (module) => ({default: module.DiagnosticsReport}),
  ),
)

export function App() {
  const inputId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [diagnostics, setDiagnostics] = useState<StudioDiagnostics>()
  const [error, setError] = useState<string>()

  const handleSubmit = useCallback((event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const parsed = parseStudioDiagnostics(inputRef.current?.value ?? '')
      setDiagnostics(parsed)
      setError(undefined)
      window.scrollTo({top: 0})
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [])

  const handleReset = useCallback(() => {
    setDiagnostics(undefined)
    setError(undefined)
    window.scrollTo({top: 0})
  }, [])

  if (diagnostics) {
    return (
      <main className="viewer-page viewer-page-report">
        <Box padding={[3, 4, 5]}>
          <Stack gap={5}>
            <ViewerHeader />
            <Suspense fallback={<ReportLoadingState />}>
              <DiagnosticsReport
                diagnostics={diagnostics}
                onRunAgain={handleReset}
                runAgainLabel="Paste another"
              />
            </Suspense>
          </Stack>
        </Box>
      </main>
    )
  }

  return (
    <main className="viewer-page">
      <Box padding={[3, 4, 5]}>
        <Stack gap={5}>
          <ViewerHeader />

          <Card border padding={[4, 5]} radius={3} shadow={1}>
            <form onSubmit={handleSubmit}>
              <Stack gap={4}>
                <Stack gap={3}>
                  <Heading as="h2" size={2}>
                    Paste diagnostics output
                  </Heading>
                  <Text muted size={1}>
                    Copy the JSON from Studio diagnostics and paste it below. The data stays in this
                    browser and is not uploaded anywhere.
                  </Text>
                </Stack>

                <Stack gap={3}>
                  <Text as="label" htmlFor={inputId} size={1} weight="medium">
                    Diagnostics JSON
                  </Text>
                  <TextArea
                    autoFocus
                    data-testid="diagnostics-input"
                    fontSize={1}
                    id={inputId}
                    placeholder={'{\n  "diagnosticVersion": 1,\n  ...\n}'}
                    ref={inputRef}
                    rows={18}
                  />
                </Stack>

                {error ? (
                  <Card padding={3} radius={2} tone="critical">
                    <Text size={1}>{error}</Text>
                  </Card>
                ) : null}

                <Flex justify="flex-end">
                  <Button mode="default" text="View diagnostics" tone="primary" type="submit" />
                </Flex>
              </Stack>
            </form>
          </Card>
        </Stack>
      </Box>
    </main>
  )
}

function ReportLoadingState() {
  return (
    <Card padding={4} radius={2}>
      <Text muted size={1}>
        Loading report…
      </Text>
    </Card>
  )
}

function ViewerHeader() {
  return (
    <Stack gap={2}>
      <Heading as="h1" size={3}>
        Studio diagnostics viewer
      </Heading>
      <Text muted size={1}>
        Inspect diagnostics gathered from a Sanity Studio session.
      </Text>
    </Stack>
  )
}
