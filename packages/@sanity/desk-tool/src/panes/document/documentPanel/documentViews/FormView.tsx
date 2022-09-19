// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {
  useDocumentPresence,
  unstable_useConditionalProperty as useConditionalProperty,
} from '@sanity/base/hooks'
import {PresenceOverlay} from '@sanity/base/presence'
import {Box, Container, Flex, Spinner, Text} from '@sanity/ui'
import afterEditorComponents from 'all:part:@sanity/desk-tool/after-editor-component'
import documentStore from 'part:@sanity/base/datastore/document'
import schema from 'part:@sanity/base/schema'
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import filterFieldFn$ from 'part:@sanity/desk-tool/filter-fields-fn?'
import {FormBuilder} from 'part:@sanity/form-builder'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {tap} from 'rxjs/operators'
import {SanityDocument} from '@sanity/client'
import {ObjectField, ObjectSchemaTypeWithOptions} from '@sanity/types'
import {useDocumentPane} from '../../useDocumentPane'
import {Delay} from '../../../../components/Delay'
import {useConditionalToast} from './useConditionalToast'
import {useEditState} from '@sanity/react-hooks'

interface FormViewProps {
  granted: boolean
  hidden: boolean
  margins: [number, number, number, number]
}

export interface FilterFieldOptions {
  (type: ObjectSchemaTypeWithOptions, field: ObjectField): boolean
}

interface FormViewState {
  filterField: FilterFieldOptions
}

const INITIAL_STATE: FormViewState = {
  filterField: () => true,
}

const preventDefault = (ev: React.FormEvent) => ev.preventDefault()
const noop = () => undefined

export function FormView(props: FormViewProps) {
  const {hidden, margins, granted} = props
  const {
    compareValue,
    documentId,
    documentSchema,
    documentType,
    focusPath,
    handleChange,
    handleFocus,
    historyController,
    initialValue,
    markers,
    ready,
    changesOpen,
  } = useDocumentPane()
  const editState = useEditState(documentId, documentType)
  const value = editState.draft || editState.published || initialValue
  const presence = useDocumentPresence(documentId, {ignoreLastActiveUpdates: true})
  const {revTime: rev} = historyController
  const [{filterField}, setFilterField] = useState<FormViewState>(INITIAL_STATE)

  const hasTypeMismatch = value !== null && value._type !== documentSchema.name
  const isNonExistent = !value || !value._id

  // Create a patch channel for each document ID
  const patchChannelRef = useRef<any>()
  if (!patchChannelRef.current) {
    patchChannelRef.current = FormBuilder.createPatchChannel()
  }

  const readOnly = useConditionalProperty({
    document: value as SanityDocument,
    value,
    checkProperty: documentSchema.readOnly,
    checkPropertyKey: 'readOnly',
  })

  const isReadOnly = useMemo(() => {
    return (
      !ready ||
      rev !== null ||
      !granted ||
      !isActionEnabled(documentSchema, 'update') ||
      (isNonExistent && !isActionEnabled(documentSchema, 'create')) ||
      readOnly
    )
  }, [documentSchema, isNonExistent, granted, ready, rev, readOnly])

  useEffect(() => {
    if (!filterFieldFn$) return undefined

    const sub = filterFieldFn$.subscribe((nextFieldFilter) => {
      setFilterField(nextFieldFilter ? {filterField: nextFieldFilter} : INITIAL_STATE)
    })

    return () => sub.unsubscribe()
  }, [])

  const handleBlur = useCallback(() => {
    // do nothing
  }, [])

  const isLocked = editState?.transactionSyncLock?.enabled

  useConditionalToast({
    id: `sync-lock-${documentId}`,
    status: 'warning',
    enabled: isLocked,
    title: `Syncing document…`,
    description: `Please hold tight while the document is synced. This usually happens right after the document has been published, and it shouldn't take more than a few seconds`,
  })

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
          {ready ? (
            <FormBuilder
              schema={schema}
              patchChannel={patchChannelRef.current}
              value={value}
              compareValue={compareValue}
              type={documentSchema}
              presence={presence}
              filterField={filterField}
              readOnly={isReadOnly || editState?.transactionSyncLock?.enabled}
              onBlur={handleBlur}
              onFocus={handleFocus}
              focusPath={focusPath}
              onChange={isReadOnly ? noop : handleChange}
              markers={markers}
              changesOpen={changesOpen}
            />
          ) : (
            <Delay ms={300}>
              <Flex align="center" direction="column" height="fill" justify="center">
                <Spinner muted />

                <Box marginTop={3}>
                  <Text align="center" muted size={1}>
                    Loading document
                  </Text>
                </Box>
              </Flex>
            </Delay>
          )}
        </Box>
      </PresenceOverlay>
    )
  }, [
    hasTypeMismatch,
    margins,
    ready,
    value,
    compareValue,
    documentSchema,
    presence,
    filterField,
    isReadOnly,
    editState?.transactionSyncLock?.enabled,
    handleBlur,
    handleFocus,
    focusPath,
    handleChange,
    markers,
    changesOpen,
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
