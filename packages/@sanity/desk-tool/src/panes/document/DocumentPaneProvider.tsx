// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {useCallback} from 'react'
import {
  useConnectionState,
  useDocumentOperation,
  useEditState,
  useValidationStatus,
} from '@sanity/react-hooks'
import {SanityDocument} from '@sanity/types'
import {Card, Code, Stack, Text} from '@sanity/ui'
import schema from 'part:@sanity/base/schema'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import {ErrorPane} from '../error'
import {LoadingPane} from '../loading'
import {DocumentHistoryProvider} from './documentHistory'
import {DocumentPane} from './DocumentPane'
import {DocumentPaneProviderProps} from './types'
import {useInitialValue} from './lib/initialValue'

declare const __DEV__: boolean

/**
 * @internal
 */
export const DocumentPaneProvider = function DocumentPaneProvider(
  props: DocumentPaneProviderProps
) {
  const {index, isClosable, pane, paneKey} = props
  const {options, menuItemGroups, title, views} = pane
  const initialValue = useInitialValue(options.id, pane.options)
  const documentIdRaw = options.id
  const documentId = getPublishedId(documentIdRaw)
  const documentTypeName = options.type
  const {patch}: any = useDocumentOperation(documentId, documentTypeName)
  const editState: any = useEditState(documentId, documentTypeName)
  const {markers} = useValidationStatus(documentId, documentTypeName)
  const connectionState = useConnectionState(documentId, documentTypeName)
  const schemaType = schema.get(documentTypeName)
  const value: Partial<SanityDocument> =
    editState?.draft || editState?.published || initialValue.value

  const onChange = useCallback((patches) => patch.execute(patches, initialValue.value), [
    patch,
    initialValue.value,
  ])

  if (!schemaType) {
    return (
      <ErrorPane
        {...props}
        flex={2.5}
        minWidth={320}
        title={
          <>
            Unknown document type: <code>{documentTypeName}</code>
          </>
        }
        tone="caution"
      >
        <Stack space={4}>
          {documentTypeName && (
            <Text as="p">
              This document has the schema type <code>{documentTypeName}</code>, which is not
              defined as a type in the local content studio schema.
            </Text>
          )}

          {!documentTypeName && (
            <Text as="p">
              This document does not exist, and no schema type was specified for it.
            </Text>
          )}

          {__DEV__ && value && (
            <>
              <Text as="p">Here is the JSON representation of the document:</Text>
              <Card padding={3} overflow="auto" radius={2} shadow={1} tone="inherit">
                <Code language="json" size={[1, 1, 2]}>
                  {JSON.stringify(value, null, 2)}
                </Code>
              </Card>
            </>
          )}
        </Stack>
      </ErrorPane>
    )
  }

  if (connectionState === 'connecting' || !editState) {
    return (
      <LoadingPane {...props} flex={2.5} minWidth={320} title={`Loading ${schemaType.title}…`} />
    )
  }

  if (initialValue.error) {
    return (
      <ErrorPane flex={2.5} minWidth={320} title="Failed to resolve initial value">
        <Text as="p">Check developer console for details.</Text>
      </ErrorPane>
    )
  }

  return (
    <DocumentHistoryProvider documentId={documentId} value={value}>
      <DocumentPane
        title={title}
        connectionState={connectionState}
        documentId={documentId}
        documentIdRaw={documentIdRaw}
        documentType={documentTypeName}
        draft={editState.draft}
        index={index}
        initialValue={initialValue.value}
        isClosable={isClosable}
        markers={markers}
        menuItemGroups={menuItemGroups}
        onChange={onChange}
        paneKey={paneKey}
        published={editState.published}
        schemaType={schemaType}
        value={value}
        compareValue={editState.published}
        views={views}
      />
    </DocumentHistoryProvider>
  )
}
