// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {useDocumentPresence} from '@sanity/base/hooks'
import {PresenceOverlay} from '@sanity/base/presence'
import {Box, Container, Text} from '@sanity/ui'
import afterEditorComponents from 'all:part:@sanity/desk-tool/after-editor-component'
import documentStore from 'part:@sanity/base/datastore/document'
import schema from 'part:@sanity/base/schema'
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import filterFieldFn$ from 'part:@sanity/desk-tool/filter-fields-fn?'
import {FormBuilder} from 'part:@sanity/form-builder'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {tap} from 'rxjs/operators'
import {useDocumentPane} from '../../useDocumentPane'

interface FormViewProps {
  hidden: boolean
  margins: [number, number, number, number]
}

interface FormViewState {
  filterField: () => boolean
}

const INITIAL_STATE: FormViewState = {
  filterField: () => true,
}

const preventDefault = (ev: React.FormEvent) => ev.preventDefault()
const noop = () => undefined

export function FormView(props: FormViewProps) {
  const {hidden, margins} = props
  const {
    compareValue,
    displayed,
    documentId,
    documentSchema,
    documentType,
    focusPath,
    handleChange,
    handleFocus,
    historyController,
    markers,
    permission,
    ready,
  } = useDocumentPane()
  const presence = useDocumentPresence(documentId)
  const {revTime: rev} = historyController
  const [{filterField}, setState] = useState<FormViewState>(INITIAL_STATE)
  const value = useMemo(() => (ready ? displayed : null), [displayed, ready])
  const hasTypeMismatch = value !== null && value._type !== documentSchema.name
  const isNonExistent = !value || !value._id

  // Create a patch channel for each document ID
  const patchChannel = useMemo(() => FormBuilder.createPatchChannel(), [documentId])

  const readOnly = useMemo(() => {
    return (
      !ready ||
      rev !== null ||
      !permission.granted ||
      !isActionEnabled(documentSchema, 'update') ||
      (isNonExistent && !isActionEnabled(documentSchema, 'create'))
    )
  }, [documentSchema, isNonExistent, permission, ready, rev])

  useEffect(() => {
    if (!filterFieldFn$) return undefined

    const sub = filterFieldFn$.subscribe((nextFilterField: any) =>
      setState({filterField: nextFilterField})
    )

    return () => sub.unsubscribe()
  }, [])

  const handleBlur = useCallback(() => {
    // do nothing
  }, [])

  useEffect(() => {
    const sub = documentStore.pair
      .documentEvents(documentId, documentType)
      .pipe(tap((event) => patchChannel.receiveEvent(event)))
      .subscribe()

    return () => {
      sub.unsubscribe()
    }
  }, [documentId, documentType, patchChannel])

  const form = useMemo(() => {
    if (hasTypeMismatch) {
      return (
        <>
          <Text>
            This document is of type <code>{value?._type}</code> and cannot be edited as{' '}
            <code>{documentSchema.name}</code>.
          </Text>

          {/* @todo */}
          {/* <Box marginTop={4}>
            <Button
              onClick={handleEditAsActualType}
              text={<>Edit as <code>{value?._type}</code> instead</>}
              tone="critical"
            />
          </Box> */}
        </>
      )
    }

    return (
      <PresenceOverlay margins={margins}>
        <Box as="form" onSubmit={preventDefault}>
          <FormBuilder
            schema={schema}
            patchChannel={patchChannel}
            value={value}
            compareValue={compareValue}
            type={documentSchema}
            presence={presence}
            filterField={filterField}
            readOnly={readOnly}
            onBlur={handleBlur}
            onFocus={handleFocus}
            focusPath={focusPath}
            onChange={readOnly ? noop : handleChange}
            markers={markers}
          />
        </Box>
      </PresenceOverlay>
    )
  }, [
    compareValue,
    documentSchema,
    filterField,
    focusPath,
    handleBlur,
    handleChange,
    handleFocus,
    hasTypeMismatch,
    margins,
    markers,
    patchChannel,
    presence,
    readOnly,
    value,
  ])

  const after = useMemo(
    () =>
      Array.isArray(afterEditorComponents) &&
      afterEditorComponents.map(
        (AfterEditorComponent: React.ComponentType<{documentId: string}>, idx: number) => (
          <AfterEditorComponent key={String(idx)} documentId={documentId} />
        )
      ),
    [documentId]
  )

  return (
    <Container
      hidden={hidden}
      paddingX={4}
      paddingTop={5}
      paddingBottom={9}
      sizing="border"
      width={1}
    >
      {form}
      {after}
    </Container>
  )
}
