import {Box, Button, Card, Container, Flex, Heading, Stack, Text, TextArea} from '@sanity/ui'
import {type SyntheticEvent, useCallback, useId, useRef, useState} from 'react'
import {DiagnosticsReport, parseStudioDiagnostics, type StudioDiagnostics} from 'sanity'

/**
 * The in-studio twin of dev/studio-diagnostics-viewer: paste the JSON copied
 * from a studio's diagnostics panel and render the same DiagnosticsReport,
 * without leaving Studio Radar. Pasted data stays in the browser.
 */
export function DiagnosticsTool() {
  const inputId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [diagnostics, setDiagnostics] = useState<StudioDiagnostics>()
  const [error, setError] = useState<string>()

  const handleSubmit = useCallback((event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const parsed = parseStudioDiagnostics(inputRef.current?.value ?? '')
      setDiagnostics(parsed)
      setError(undefined)
      scrollRef.current?.scrollTo({top: 0})
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [])

  const handleReset = useCallback(() => {
    setDiagnostics(undefined)
    setError(undefined)
    scrollRef.current?.scrollTo({top: 0})
  }, [])

  return (
    <Card height="fill" overflow="auto" ref={scrollRef}>
      <Container width={2}>
        <Box padding={[3, 4, 5]}>
          {diagnostics ? (
            <DiagnosticsReport
              diagnostics={diagnostics}
              onRunAgain={handleReset}
              runAgainLabel="Paste another"
            />
          ) : (
            <Card border padding={[4, 5]} radius={3}>
              <form onSubmit={handleSubmit}>
                <Stack gap={4}>
                  <Stack gap={3}>
                    <Heading as="h2" size={2}>
                      Paste diagnostics output
                    </Heading>
                    <Text muted size={1}>
                      Copy the JSON from Studio diagnostics and paste it below. The data stays in
                      this browser and is not uploaded anywhere.
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
          )}
        </Box>
      </Container>
    </Card>
  )
}
