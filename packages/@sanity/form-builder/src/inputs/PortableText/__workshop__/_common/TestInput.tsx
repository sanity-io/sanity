import {PortableTextBlock, Type as PTType} from '@sanity/portable-text-editor'
import {Path, Schema} from '@sanity/types'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import FormBuilderContext from '../../../../FormBuilderContext'
import PortableTextInput from '../../PortableTextInput'
import {applyAll} from '../../../../simplePatch'
import {RenderBlockActions} from '../../types'
import {inputResolver} from './input'
import {resolvePreviewComponent} from './resolvePreviewComponent'

interface TestInputProps {
  markers?: any[]
  readOnly?: boolean
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: (markers: any) => any
  schema: Schema
  type: PTType
  value: PortableTextBlock[] | undefined
  withError?: boolean
  withCustomMarkers?: boolean
}

export function TestInput(props: TestInputProps) {
  const {
    markers: propsMarkers,
    readOnly = false,
    renderBlockActions,
    renderCustomMarkers,
    type,
    value: propsValue,
    withError = false,
    withCustomMarkers = false,
  } = props
  const [value, setValue] = useState<any[]>(propsValue)
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
  const [markers, setMarkers] = useState<any[]>(propsMarkers || [])

  useEffect(() => {
    if (value) {
      const newMarkers = [...(propsMarkers || [])]
      value.forEach((blk) => {
        if (blk._type === blockType.name) {
          const inline = blk.children.find((child) => child._type !== 'span')
          const annotation = blk.markDefs[0]
          if (inline) {
            if (withError) {
              newMarkers.push({
                type: 'validation',
                level: 'error',
                path: [{_key: blk._key}, 'children', {_key: inline._key}],
                item: {message: 'There is an error with this inline object'},
              })
            }
            if (withCustomMarkers) {
              newMarkers.push({
                type: 'customMarkerTest',
                path: [{_key: blk._key}, 'children', {_key: inline._key}],
              })
            }
          } else if (annotation) {
            if (withError) {
              newMarkers.push({
                type: 'validation',
                level: 'error',
                path: [{_key: blk._key}, 'markDefs', {_key: annotation._key}],
                item: {message: 'There an error with this annotation'},
              })
            }
            if (withCustomMarkers) {
              newMarkers.push({
                type: 'customMarkerTest',
                path: [{_key: blk._key}, 'markDefs', {_key: annotation._key}],
              })
            }
          } else {
            if (withError) {
              newMarkers.push({
                type: 'validation',
                level: 'error',
                path: [{_key: blk._key}],
                item: {message: 'There is an error with this textblock'},
              })
            }
            if (withCustomMarkers) {
              newMarkers.push({
                type: 'customMarkerTest',
                path: [{_key: blk._key}],
              })
            }
          }
        } else {
          if (withError) {
            newMarkers.push({
              type: 'validation',
              level: 'error',
              path: [{_key: blk._key}, 'title'],
              item: {message: 'There is an error with this object block'},
            })
          }
          if (withCustomMarkers) {
            newMarkers.push({
              type: 'customMarkerTest',
              path: [{_key: blk._key}],
            })
          }
        }
      })
      setMarkers(newMarkers)
    }
    if (!withError && !withCustomMarkers) {
      setMarkers(propsMarkers || [])
    }
  }, [blockType.name, propsMarkers, value, withCustomMarkers, withError])

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
        renderBlockActions={renderBlockActions}
        renderCustomMarkers={renderCustomMarkers}
        subscribe={subscribe}
        type={props.type}
        value={value}
      />
    </FormBuilderContext>
  )
}
