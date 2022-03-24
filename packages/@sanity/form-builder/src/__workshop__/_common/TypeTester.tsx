import React, {useCallback, useEffect, useRef, useState, useMemo} from 'react'
import {Button, Card, Label, Stack, Text, TextArea} from '@sanity/ui'
import styled, {createGlobalStyle} from 'styled-components'
import {runTest} from './typer'

const HIGHLIGHT_CLASSNAME = 'js-highlight-selected-input'

const GlobalStyle = createGlobalStyle`
  .${HIGHLIGHT_CLASSNAME} {
    outline: 2px solid red;
  }
`

function getNameFromInput(input: HTMLInputElement | HTMLTextAreaElement) {
  const classNames = input.classList
    .toString()
    .split(' ')
    .filter((name) => name !== HIGHLIGHT_CLASSNAME)
    .join('.')
  return `${input.tagName.toLowerCase()}.${classNames}`
}

const Sticky = styled.div`
  position: sticky;
  top: 1rem;
  z-index: 2;
`

interface TypeTesterProps {
  readOnly?: boolean
}

export function TypeTester({readOnly}: TypeTesterProps) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const [focusedInput, setFocusedInput] = useState<HTMLInputElement | HTMLTextAreaElement>()
  const [testOutput, setTestOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const cancelTypeTester = useRef<() => boolean>(() => true)

  const handleFocus = useCallback(
    (e: FocusEvent) => {
      if (textAreaRef.current && e.target === textAreaRef.current) {
        return
      }
      if (
        (e.type === 'focusin' && e.target instanceof HTMLInputElement) ||
        e.target instanceof HTMLTextAreaElement
      ) {
        setFocusedInput(e.target)
      }
    },
    [textAreaRef]
  )

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
      inputElement: focusedInput!,
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

  const handleHighlightMouseOver = useCallback(
    (event) => {
      if (event.type === 'mouseover') {
        focusedInput!.classList.add(HIGHLIGHT_CLASSNAME)
      }
      if (event.type === 'mouseout') {
        focusedInput!.classList.remove(HIGHLIGHT_CLASSNAME)
      }
    },
    [focusedInput]
  )

  const handleHighlightClick = useCallback(() => {
    if (focusedInput) {
      focusedInput.focus()
    }
  }, [focusedInput])

  const isDisabled = useMemo(() => {
    return (
      isRunning ||
      !focusedInput ||
      !['INPUT', 'TEXTAREA'].includes(focusedInput.tagName) ||
      readOnly
    )
  }, [focusedInput, isRunning, readOnly])

  return (
    <Sticky>
      <Card padding={4} tone="default" border>
        <Stack space={4}>
          <Label size={0}>Type Performance Tester</Label>
          <Text
            title={isDisabled ? undefined : `Click to focus input`}
            size={1}
            onClick={handleHighlightClick}
            onMouseOver={handleHighlightMouseOver}
            onMouseOut={handleHighlightMouseOver}
          >
            {isDisabled && !isRunning
              ? 'No input selected'
              : `Selected input: ${focusedInput ? getNameFromInput(focusedInput) : '<none>'}`}
          </Text>
          <TextArea ref={textAreaRef} readOnly rows={6} value={testOutput} />
          <Button
            text="Run test"
            onClick={handleRunTest}
            disabled={isDisabled}
            loading={isRunning}
          />
        </Stack>
      </Card>
      <GlobalStyle />
    </Sticky>
  )
}
