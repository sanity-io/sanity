import {Type as PTType} from '@sanity/portable-text-editor'
import {Path, Schema} from '@sanity/types'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import FormBuilderContext from '../../../FormBuilderContext'
import PortableTextInput from '../PortableTextInput'
import {applyAll} from '../../../simplePatch'
import {inputResolver} from './input'
import {resolvePreviewComponent} from './resolvePreviewComponent'

interface TestInputProps {
  readOnly?: boolean
  value: any[]
  schema: Schema
  type: PTType
}

export function TestInput(props: TestInputProps) {
  const {readOnly = false} = props
  const [value, setValue] = useState<any[]>(props.value)
  const [focusPath, setFocusPath] = useState<Path>([])
  const onFocus = useCallback((path: Path) => {
    setFocusPath(path)
  }, [])
  const onBlur = useCallback(() => {
    setFocusPath([])
  }, [])
  const onChange = useCallback(
    (event) => {
      const newValue = applyAll(value, event.patches)
      setValue(newValue)
    },
    [value]
  )
  const presence = useMemo(() => [], [])
  const markers = useMemo(() => [], [])
  const hotkeys = useMemo(() => ({}), [])

  const patchChannel = useMemo(() => {
    return {onPatch: () => () => undefined}
  }, [])

  const subscribe = useCallback(() => () => undefined, [])

  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  return (
    <FormBuilderContext
      value={value}
      patchChannel={patchChannel}
      schema={props.schema}
      resolveInputComponent={inputResolver}
      resolvePreviewComponent={resolvePreviewComponent}
    >
      <PortableTextInput
        focusPath={focusPath}
        hotkeys={hotkeys}
        level={1}
        markers={markers}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        presence={presence}
        readOnly={readOnly}
        subscribe={subscribe}
        type={props.type}
        value={value}
      />
    </FormBuilderContext>
  )
}
