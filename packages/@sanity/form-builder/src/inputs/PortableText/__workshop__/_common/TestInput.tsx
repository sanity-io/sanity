import {PortableTextBlock, Type as PTType} from '@sanity/portable-text-editor'
import {Path, Schema} from '@sanity/types'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import FormBuilderContext from '../../../../FormBuilderContext'
import PortableTextInput from '../../PortableTextInput'
import {applyAll} from '../../../../simplePatch'
import {RenderBlockActions} from '../../types'
import {useUnique} from '../../Toolbar/lib/useUnique'
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
  withWarning?: boolean
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
    withWarning = false,
    withCustomMarkers = false,
  } = props
  const [value, setValue] = useState<any[]>(propsValue)
  const [focusPath, setFocusPath] = useState<Path>(undefined)
  const blockType = useMemo(() => type.of.find((t) => t.type.name === 'block'), [type])
  const presence = useMemo(() => [], [])
  const hotkeys = useMemo(() => ({}), [])
  const [markers, setMarkers] = useState<any[]>(propsMarkers || [])
  const uniqMarkers = useUnique(markers)

  const onFocus = useCallback((path: Path) => {
    // console.log('onFocus', path)
    setFocusPath(path)
  }, [])

  const onBlur = useCallback(() => {
    // console.log('onBlur')
    setFocusPath(undefined)
  }, [])

  const onChange = useCallback((event) => {
    setValue((prevValue) => applyAll(prevValue, event.patches))
  }, [])

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
            if (withWarning) {
              newMarkers.push({
                type: 'validation',
                level: 'warning',
                path: [{_key: blk._key}, 'children', {_key: inline._key}],
                item: {message: 'This is a warning'},
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
            if (withWarning) {
              newMarkers.push({
                type: 'validation',
                level: 'warning',
                path: [{_key: blk._key}, 'markDefs', {_key: annotation._key}],
                item: {message: 'This is a warning'},
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
            if (withWarning) {
              newMarkers.push({
                type: 'validation',
                level: 'warning',
                path: [{_key: blk._key}],
                item: {message: 'This is a warning'},
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
          if (withWarning) {
            newMarkers.push({
              type: 'validation',
              level: 'warning',
              path: [{_key: blk._key}, 'title'],
              item: {message: 'This is a warning'},
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
    if (!withError && !withCustomMarkers && !withWarning) {
      setMarkers(propsMarkers || [])
    }
  }, [blockType.name, propsMarkers, value, withCustomMarkers, withError, withWarning])

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
      {/* <div
        style={{
          position: 'absolute',
          top: 0,
          zIndex: 999,
          background: 'white',
          padding: 10,
          left: 0,
          border: '1px solid red',
        }}
      >
        <pre>{JSON.stringify(focusPath, null, 2)}</pre>
      </div> */}
      <PortableTextInput
        focusPath={focusPath}
        hotkeys={hotkeys}
        level={1}
        markers={uniqMarkers}
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
