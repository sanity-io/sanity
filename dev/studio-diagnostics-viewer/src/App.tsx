import {Box, Button, Card, Heading, Text, TextArea} from '@sanity/ui'
import {lazy, Suspense, type SyntheticEvent, useCallback, useId, useRef, useState} from 'react'
import {type StudioDiagnostics} from 'sanity'
import {Flex, VStack} from 'ui5'

// Loaded on demand so the initial paste screen doesn't carry the sanity
// package; the report and the parser share the same lazy chunk. Module-scope
// because React Compiler cannot lower import() inside a component body.
const loadSanityModule = () => import('sanity')

const DiagnosticsReport = lazy(() =>
  loadSanityModule().then((module) => ({default: module.DiagnosticsReport})),
)

export function App() {
  const inputId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [diagnostics, setDiagnostics] = useState<StudioDiagnostics>()
  const [error, setError] = useState<string>()
  const [parsing, setParsing] = useState(false)

  const handleSubmit = useCallback(async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    setParsing(true)
    try {
      const {parseStudioDiagnostics} = await loadSanityModule()
      const parsed = parseStudioDiagnostics(inputRef.current?.value ?? '')
      setDiagnostics(parsed)
      setError(undefined)
      window.scrollTo({top: 0})
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
    setParsing(false)
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
          <VStack gap={5}>
            <ViewerHeader />
            <Suspense fallback={<ReportLoadingState />}>
              <DiagnosticsReport
                diagnostics={diagnostics}
                onRunAgain={handleReset}
                runAgainLabel="Paste another"
              />
            </Suspense>
          </VStack>
        </Box>
      </main>
    )
  }

  return (
    <main className="viewer-page">
      <Box padding={[3, 4, 5]}>
        <VStack gap={5}>
          <ViewerHeader />

          <Card border padding={[4, 5]} radius={3} shadow={1}>
            <form onSubmit={handleSubmit}>
              <VStack gap={4}>
                <VStack gap={3}>
                  <Heading as="h2" size={2}>
                    Paste diagnostics output
                  </Heading>
                  <Text muted size={1}>
                    Copy the JSON from Studio diagnostics and paste it below. The data stays in this
                    browser and is not uploaded anywhere.
                  </Text>
                </VStack>

                <VStack gap={3}>
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
                </VStack>

                {error ? (
                  <Card padding={3} radius={2} tone="critical">
                    <Text size={1}>{error}</Text>
                  </Card>
                ) : null}

                <Flex justifyContent="flex-end">
                  <Button
                    loading={parsing}
                    mode="default"
                    text="View diagnostics"
                    tone="primary"
                    type="submit"
                  />
                </Flex>
              </VStack>
            </form>
          </Card>
        </VStack>
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
    <VStack gap={2}>
      <Heading as="h1" size={3}>
        Studio diagnostics viewer
      </Heading>
      <Text muted size={1}>
        Inspect diagnostics gathered from a Sanity Studio session.
      </Text>
    </VStack>
  )
}
