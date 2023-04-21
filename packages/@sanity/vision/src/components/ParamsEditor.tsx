import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {debounce} from 'lodash'
import {tryParseParams} from '../util/tryParseParams'
import {VisionCodeMirror} from '../codemirror/VisionCodeMirror'

const defaultValue = `{\n  \n}`

export interface ParamsEditorChangeEvent {
  parsed: Record<string, unknown>
  raw: string
  valid: boolean
  error: string | undefined
}

export interface ParamsEditorProps {
  value: string
  onChange: (changeEvt: ParamsEditorChangeEvent) => void
}

export interface ParamsEditorChange {
  valid: boolean
}

export function ParamsEditor(props: ParamsEditorProps) {
  const {onChange} = props
  const {raw: value, error, parsed, valid} = eventFromValue(props.value)
  const [isValid, setValid] = useState(valid)
  const [init, setInit] = useState(false)

  // Emit onChange on very first render
  useEffect(() => {
    if (!init) {
      onChange({parsed, raw: value, valid: isValid, error})
      setInit(true)
    }
  }, [error, init, isValid, onChange, parsed, value])

  const handleChangeRaw = useCallback(
    (newValue: string) => {
      const event = eventFromValue(newValue)
      setValid(event.valid)
      onChange(event)
    },
    [onChange]
  )

  const handleChange = useMemo(() => debounce(handleChangeRaw, 333), [handleChangeRaw])
  return <VisionCodeMirror value={props.value || defaultValue} onChange={handleChange} />
}

function eventFromValue(value: string): ParamsEditorChangeEvent {
  const parsedParams = tryParseParams(value)
  const params = parsedParams instanceof Error ? {} : parsedParams
  const validationError = parsedParams instanceof Error ? parsedParams.message : undefined
  const isValid = !validationError

  return {
    parsed: params,
    raw: value,
    valid: isValid,
    error: validationError,
  }
}
