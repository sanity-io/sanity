import React, {useCallback, useEffect, useRef, useState, useMemo} from 'react'
import {Button, Card, Label, Stack, TextArea} from '@sanity/ui'
import {runTest} from './typer'

export function TypeTester() {
  const [focusedInput, setFocusedInput] = useState<HTMLInputElement | HTMLTextAreaElement>()
  const [testOutput, setTestOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const cancelTypeTester = useRef<() => boolean>(() => true)

  const handleFocus = useCallback((e: FocusEvent) => {
    if (
      (e.type === 'focusin' && e.target instanceof HTMLInputElement) ||
      e.target instanceof HTMLTextAreaElement
    ) {
      setFocusedInput(e.target)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('focusin', handleFocus)
    return () => {
      document.removeEventListener('focusin', handleFocus)
      if (cancelTypeTester.current) {
        cancelTypeTester.current()
      }
    }
  }, [handleFocus])

  const handleRunTest = useCallback(() => {
    setIsRunning(true)
    setTestOutput('Running test...')
    cancelTypeTester.current = runTest({
      inputElement: focusedInput,
      times: 4,
      gracePeriod: 4000,
      onRun: (output: string) => {
        setTestOutput((existing) => `${existing}\n${output}`)
      },
      onFinished: () => {
        setIsRunning(false)
      },
    })
  }, [focusedInput])

  const isDisabled = useMemo(() => {
    return isRunning || !focusedInput || !['INPUT', 'TEXTAREA'].includes(focusedInput.tagName)
  }, [focusedInput, isRunning])

  return (
    <Card padding={4} tone="default" border>
      <Stack space={4}>
        <Label size={0}>Type Performance Tester</Label>
        <TextArea readOnly rows={6} value={testOutput} />
        <Button text="Run test" onClick={handleRunTest} disabled={isDisabled} loading={isRunning} />
      </Stack>
    </Card>
  )
}
