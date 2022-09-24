import {Path} from '@sanity/types'
import {Card, Container} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {useDocumentOperation, useEditState, useSchema, useValidationStatus} from '../../hooks'
import {useUnique} from '../../util'
import {createPatchChannel} from '../patch/PatchChannel'

export default function FormBuilderStory() {
  const documentId = '8ab96211-501c-45e3-9eb0-4ed1da1b50df'
  const documentType = 'author'
  // @todo: there should be a hook for this
  const initialValue = useMemo(
    () => ({loaded: true, value: {_id: documentId, _type: documentType}}),
    []
  )

  const schema = useSchema()
  const schemaType = schema.get(documentType)
  const editState = useEditState(documentId, documentType)
  const {patch}: any = useDocumentOperation(documentId, documentType)
  const value = editState.draft || editState.published
  const {validation: validationRaw} = useValidationStatus(documentId, documentType)
  const validation = useUnique(validationRaw)
  const [focusPath, setFocusPath] = useState<Path>([])
  const presence = useMemo(() => [], [])

  // Create a patch channel
  const patchChannel = useMemo(() => createPatchChannel(), [])

  const filterField = useCallback(() => true, [])

  const handleBlur = useCallback(() => {
    console.warn('handleBlur')
    // setFocusPath([])
  }, [])

  const handleChange = useCallback(
    (patches: any) => {
      patch.execute(patches, initialValue.value)
    },
    [patch, initialValue.value]
  )

  const handleFocus = useCallback((nextFocusPath?: Path | React.FocusEvent<any>) => {
    if (Array.isArray(nextFocusPath)) {
      setFocusPath(nextFocusPath)
    }
  }, [])

  if (!schemaType) {
    return (
      <div>
        Schema type not found: <>{documentType}</>
      </div>
    )
  }

  return (
    <Card paddingX={4} paddingY={[4, 5, 6, 7]} style={{minHeight: '100%', position: 'relative'}}>
      <Container width={1}>
        TODO
        {/*<FormBuilder*/}
        {/*  __internal_patchChannel={patchChannel}*/}
        {/*  autoFocus*/}
        {/*  changesOpen={false}*/}
        {/*  compareValue={value}*/}
        {/*  // filterField={filterField}*/}
        {/*  focusPath={focusPath}*/}
        {/*  validation={validation}*/}
        {/*  onBlur={handleBlur}*/}
        {/*  onChange={handleChange}*/}
        {/*  onFocus={handleFocus}*/}
        {/*  presence={presence}*/}
        {/*  readOnly={false}*/}
        {/*  schema={schema}*/}
        {/*  type={schemaType}*/}
        {/*  value={value}*/}
        {/*/>*/}
      </Container>
    </Card>
  )
}
