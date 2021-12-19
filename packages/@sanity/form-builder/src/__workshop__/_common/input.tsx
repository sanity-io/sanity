import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
} from 'react'
import type {Path, Schema as SchemaSchema} from '@sanity/types'
import {
  Button,
  Box,
  Card,
  Code,
  Label,
  LayerProvider,
  Stack,
  studioTheme,
  TextArea,
  Theme,
  ThemeProvider,
  ToastProvider,
} from '@sanity/ui'
import styled, {css} from 'styled-components'
import FormBuilderContext from '../../FormBuilderContext'
import type {PatchChannelOptions} from '../../FormBuilderContext'
import {inputResolver} from './inputResolver'
import {resolvePreviewComponent} from './resolvePreviewComponent'
import {runTest} from './typer'

type FormBuilderOptions = {
  value: any | null
  children: React.ReactElement
  schema: SchemaSchema
  patchChannel: PatchChannelOptions
}

interface FormDebuggerOptions {
  value: any | null
  focusPath: Path
}
interface FilterFieldInputOptions {
  onChange: (value) => void
  value: string | null
}

export function FormBuilderTester(props: FormBuilderOptions) {
  const {value, patchChannel} = props
  return (
    <ThemeProvider scheme="light" theme={studioTheme}>
      <LayerProvider>
        <ToastProvider>
          <FormBuilderContext
            value={value}
            patchChannel={patchChannel}
            schema={props.schema}
            resolveInputComponent={inputResolver}
            resolvePreviewComponent={resolvePreviewComponent}
          >
            {props.children}
          </FormBuilderContext>
        </ToastProvider>
      </LayerProvider>
    </ThemeProvider>
  )
}

export function FormDebugger(props: FormDebuggerOptions) {
  const {value, focusPath} = props
  return (
    <Card padding={4} tone="default" border>
      <Stack space={4}>
        <Label size={0}>Debug output</Label>
        <Box overflow="auto">
          <Code>{JSON.stringify({focusPath, value}, null, 2)}</Code>
        </Box>
      </Stack>
    </Card>
  )
}

const EXAMPLE_FILTER_FUNCTION = `(type, field) => field.name === 'title'`

const ExampleCode = styled(Code)`
  cursor: pointer;
`

export const FilterFieldInput = React.forwardRef(function FilterFieldInput(
  props: FilterFieldInputOptions,
  ref: MutableRefObject<HTMLTextAreaElement>
) {
  const {value, onChange} = props
  const [internalValue, setInternalValue] = useState(value)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleChange = useCallback(
    (event) => {
      setInternalValue(event.target.value)
    },
    [setInternalValue]
  )

  const handleFilterExample = useCallback(() => {
    setInternalValue(EXAMPLE_FILTER_FUNCTION)
  }, [setInternalValue])

  const handleFilter = useCallback(() => {
    onChange(internalValue)
  }, [onChange, internalValue])

  const isDisabled = useMemo(() => {
    return internalValue.length === 0
  }, [internalValue])

  return (
    <Card padding={4} tone="default" border>
      <Stack space={4}>
        <Label size={0}>Function value</Label>
        <TextArea rows={4} ref={ref} onChange={handleChange} value={internalValue} />
        <ExampleCode
          title="Use example code"
          size={1}
          onClick={handleFilterExample}
        >{`Example: ${EXAMPLE_FILTER_FUNCTION}`}</ExampleCode>
        <Button text="Filter" onClick={handleFilter} disabled={isDisabled} />
      </Stack>
    </Card>
  )
})

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

const DebugTextArea = styled(TextArea)(({theme}: {theme: Theme}) => {
  return css`
    font-family: ${theme.sanity.fonts.code.family};
  `
})

export const DebugInput = React.forwardRef(function DebugInput(props: any, ref) {
  const rootRef = useRef<HTMLTextAreaElement | null>(null)

  useImperativeHandle(ref, () => ({
    blur: () => rootRef.current?.blur(),
    focus: () => rootRef.current?.focus(),
  }))

  return (
    <DebugTextArea
      padding={3}
      radius={1}
      readOnly
      ref={rootRef}
      rows={10}
      value={JSON.stringify(props.value, null, 2)}
    />
  )
})
