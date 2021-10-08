import {Type as PTType} from '@sanity/portable-text-editor'
import {Marker, Path, Schema} from '@sanity/types'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import FormBuilderContext from '../../../FormBuilderContext'
import PortableTextInput from '../PortableTextInput'
import {applyAll} from '../../../simplePatch'
import {inputResolver} from './input'
import {resolvePreviewComponent} from './resolvePreviewComponent'
import {type} from 'os'

interface TestInputProps {
  readOnly?: boolean
  value: any[]
  schema: Schema
  type: PTType
  withError?: boolean
}

export function TestInput(props: TestInputProps) {
  const {readOnly = false, withError = false, type} = props
  const [value, setValue] = useState<any[]>(props.value)
  const [focusPath, setFocusPath] = useState<Path>([])
  const blockType = useMemo(() => type.of.find((t) => t.type.name === 'block'), [type])
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
  const hotkeys = useMemo(() => ({}), [])
  const [markers, setMarkers] = useState<Marker[]>([])
  useEffect(() => {
    if (withError && value) {
      const newMarkers = []
      value.forEach((blk) => {
        if (blk._type !== blockType.name) {
          newMarkers.push({
            type: 'validation',
            level: 'error',
            path: [{_key: blk._key}],
          })
        } else {
          const inline = blk.children.find((child) => child._type !== 'span')
          if (inline) {
            newMarkers.push({
              type: 'validation',
              level: 'error',
              path: [{_key: blk._key}, 'children', {_key: inline._key}],
              item: {cloneWithMessage: () => 'There is an error'},
            })
          }
          const annotation = blk.markDefs[0]
          if (annotation) {
            newMarkers.push({
              type: 'validation',
              level: 'error',
              path: [{_key: blk._key}, 'markDefs', {_key: annotation._key}],
              item: {cloneWithMessage: () => 'There is another error'},
            })
          }
        }
      })
      setMarkers(newMarkers)
    }
    if (!withError) {
      setMarkers([])
    }
  }, [value, withError])

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
