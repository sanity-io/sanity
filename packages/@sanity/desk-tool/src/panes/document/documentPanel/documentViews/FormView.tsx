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
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
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
  const patchChannelRef = useRef<any>()
  if (!patchChannelRef.current) {
    patchChannelRef.current = FormBuilder.createPatchChannel()
  }

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
      .pipe(tap((event) => patchChannelRef.current.receiveEvent(event)))
      .subscribe()

    return () => {
      sub.unsubscribe()
    }
  }, [documentId, documentType, patchChannelRef])

  const hasRev = Boolean(value?._rev)
  useEffect(() => {
    if (hasRev) {
      // this is a workaround for an issue that caused the document pushed to withDocument to get
      // stuck at the first initial value.
      // This effect is triggered only when the document goes from not having a revision, to getting one
      // so it will kick in as soon as the document is received from the backend
      patchChannelRef.current.receiveEvent({type: 'mutation', mutations: [], document: value})
    }
    // React to changes in hasRev only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRev])

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
            patchChannel={patchChannelRef.current}
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
    patchChannelRef,
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
