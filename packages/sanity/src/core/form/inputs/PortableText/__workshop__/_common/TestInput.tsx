import {ArraySchemaType, Path, ValidationMarker, PortableTextBlock} from '@sanity/types'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {PortableTextMarker, RenderCustomMarkers} from '../../../../types'
import {applyAll} from '../../../../patch/simplePatch'
import {RenderBlockActionsCallback} from '../../types'
import {createPatchChannel} from '../../../../patch/PatchChannel'
import {useSource} from '../../../../../studio'

interface TestInputProps {
  markers?: PortableTextMarker[]
  validation?: ValidationMarker[]
  readOnly?: boolean
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
  // schema: Schema
  type: ArraySchemaType
  value?: PortableTextBlock[]
  withError?: boolean
  withWarning?: boolean
  withCustomMarkers?: boolean
}

export function TestInput(props: TestInputProps) {
  const {
    markers: markersProp = [],
    validation: validationProp = [],
    readOnly = false,
    renderBlockActions,
    renderCustomMarkers,
    type,
    value: valueProp = [],
    withError = false,
    withWarning = false,
    withCustomMarkers = false,
  } = props
  const {form} = useSource()
  const [value, setValue] = useState<PortableTextBlock[]>(valueProp)
  const [focusPath, setFocusPath] = useState<Path>([])
  const blockType = useMemo(() => type.of?.find((t) => t.type?.name === 'block'), [type])
  const presence = useMemo(() => [], [])
  const hotkeys = useMemo(() => ({}), [])
  const [markers, setMarkers] = useState<PortableTextMarker[]>([])
  const [validation, setValidation] = useState<ValidationMarker[]>([])

  // const resolveInputComponent: FormInputComponentResolver = useCallback(
  //   (_type) => inputResolver(_type, form),
  //   [form]
  // )

  const onFocus = useCallback((pathOrEvent?: Path | React.FocusEvent) => {
    setFocusPath(Array.isArray(pathOrEvent) ? pathOrEvent : [])
  }, [])

  const onBlur = useCallback(() => {
    setFocusPath([])
  }, [])

  const onChange = useCallback((event: any) => {
    setValue((prevValue) => applyAll(prevValue, event.patches))
  }, [])

  // useEffect(() => {
  //   if (value) {
  //     const newValidation = [...validationProp]
  //     const newMarkers = [...markersProp]

  //     value.forEach((blk) => {
  //       if (blk._type === blockType.name) {
  //         const inline = blk.children.find((child) => child._type !== 'span')
  //         const annotation = blk.markDefs[0]
  //         if (inline) {
  //           if (withError) {
  //             newValidation.push({
  //               level: 'error',
  //               path: [{_key: blk._key}, 'children', {_key: inline._key}],
  //               item: {message: 'There is an error with this inline object'},
  //             })
  //           }
  //           if (withWarning) {
  //             newValidation.push({
  //               level: 'warning',
  //               path: [{_key: blk._key}, 'children', {_key: inline._key}],
  //               item: {message: 'This is a warning'},
  //             })
  //           }
  //           if (withCustomMarkers) {
  //             newMarkers.push({
  //               type: 'customMarkerTest',
  //               path: [{_key: blk._key}, 'children', {_key: inline._key}],
  //             })
  //           }
  //         } else if (annotation) {
  //           if (withError) {
  //             newValidation.push({
  //               level: 'error',
  //               path: [{_key: blk._key}, 'markDefs', {_key: annotation._key}],
  //               item: {message: 'There an error with this annotation'},
  //             })
  //           }
  //           if (withWarning) {
  //             newValidation.push({
  //               level: 'warning',
  //               path: [{_key: blk._key}, 'markDefs', {_key: annotation._key}],
  //               item: {message: 'This is a warning'},
  //             })
  //           }
  //           if (withCustomMarkers) {
  //             newMarkers.push({
  //               type: 'customMarkerTest',
  //               path: [{_key: blk._key}, 'markDefs', {_key: annotation._key}],
  //             })
  //           }
  //         } else {
  //           if (withError) {
  //             newValidation.push({
  //               level: 'error',
  //               path: [{_key: blk._key}],
  //               item: {message: 'There is an error with this textblock'},
  //             })
  //           }
  //           if (withWarning) {
  //             newValidation.push({
  //               level: 'warning',
  //               path: [{_key: blk._key}],
  //               item: {message: 'This is a warning'},
  //             })
  //           }
  //           if (withCustomMarkers) {
  //             newMarkers.push({
  //               type: 'customMarkerTest',
  //               path: [{_key: blk._key}],
  //             })
  //           }
  //         }
  //       } else {
  //         if (withError) {
  //           newValidation.push({
  //             level: 'error',
  //             path: [{_key: blk._key}, 'title'],
  //             item: {message: 'There is an error with this object block'},
  //           })
  //         }
  //         if (withWarning) {
  //           newValidation.push({
  //             level: 'warning',
  //             path: [{_key: blk._key}, 'title'],
  //             item: {message: 'This is a warning'},
  //           })
  //         }
  //         if (withCustomMarkers) {
  //           newMarkers.push({
  //             type: 'customMarkerTest',
  //             path: [{_key: blk._key}],
  //           })
  //         }
  //       }
  //     })
  //     setMarkers(newMarkers)
  //     setValidation(newValidation)
  //   }
  //   if (!withError && !withCustomMarkers && !withWarning) {
  //     setMarkers(markersProp)
  //     setValidation(validationProp)
  //   }
  // }, [blockType, markersProp, validationProp, value, withCustomMarkers, withError, withWarning])

  const patchChannel = useMemo(() => createPatchChannel(), [])

  useEffect(() => {
    setValue(props.value || [])
  }, [props.value])

  return <>TODO</>

  // return (
  //   <FormBuilderProvider
  //     __internal_patchChannel={patchChannel}
  //     onChange={onChange}
  //     value={value}
  //     {...formBuilder}
  //   >
  //     <ReviewChangesContextProvider changesOpen={false}>
  //       {/* <Box
  //         style={{
  //          width: '300px',
  //          height: '300px',
  //          position: 'absolute',
  //          bottom: 0,
  //          zIndex: 9999,
  //          padding: 10,
  //          left: 0,
  //         }}
  //         >
  //         <Box marginBottom={3}>
  //          <Heading size={1}>FocusPath</Heading>
  //         </Box>
  //         <Box>
  //          <Code size={5}>{JSON.stringify(focusPath, null, 2)}</Code>
  //         </Box>
  //         </Box> */}
  //       <>TODO</>
  //       {/* <PortableTextInput
  //         focusPath={focusPath}
  //         hotkeys={hotkeys}
  //         level={1}
  //         markers={markers}
  //         validation={validation}
  //         onBlur={onBlur}
  //         onChange={onChange}
  //         onFocus={onFocus}
  //         presence={presence}
  //         readOnly={readOnly}
  //         renderBlockActions={renderBlockActions}
  //         renderCustomMarkers={renderCustomMarkers}
  //         type={props.type as any}
  //         value={value}
  //       /> */}
  //     </ReviewChangesContextProvider>
  //   </FormBuilderProvider>
  // )
}
