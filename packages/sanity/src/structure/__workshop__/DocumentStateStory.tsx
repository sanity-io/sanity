import {Box, Button, Code, Dialog, Stack} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
  type EditStateFor,
  useConnectionState,
  useEditState,
  useInitialValue,
  useSource,
  useUnique,
  useValidationStatus,
} from 'sanity'

import {DocumentPaneProvider} from '../panes'
import {StructureToolProvider} from '../StructureToolProvider'
import {type DocumentPaneNode} from '../types'

export default function InitialValueStory() {
  const documentId = 'test'
  const documentType = 'author'

  const pane: DocumentPaneNode = useMemo(
    () => ({
      id: documentId,
      options: {
        id: documentId,
        type: documentType,
      },
      type: 'document',
      title: 'Workshop',
    }),
    [documentId, documentType],
  )

  return (
    <StructureToolProvider>
      <DocumentPaneProvider index={0} itemId={documentId} pane={pane} paneKey={documentId}>
        <Debug documentId={documentId} documentType={documentType} />
      </DocumentPaneProvider>
    </StructureToolProvider>
  )
}

function Debug(props: {documentId: string; documentType: string}) {
  const {documentId, documentType} = props

  const templateName = undefined // 'author-developer'
  const templateParams = undefined // {}

  const initialValue = useInitialValue({
    documentId,
    documentType,
    templateName,
    templateParams,
  })

  const editState = useEditState(documentId, documentType)
  const {validation} = useValidationStatus(documentId, documentType)
  const connectionState = useConnectionState(documentId, documentType)

  const value = editState?.draft || editState?.published || initialValue.value

  const documentActions = useDocumentActions(documentId, documentType, editState)

  return (
    <Box padding={4}>
      <Code language="json" size={1}>
        {JSON.stringify(
          {
            connectionState,
            documentId,
            documentType,
            initialValue,
            validation,
            templateName,
            templateParams,
            value,
          },
          null,
          2,
        )}
      </Code>

      {documentActions.node}

      {documentActions.items && (
        <>
          <Stack space={1}>
            {documentActions.items.map(
              (actionItem, idx) =>
                actionItem && (
                  <Button
                    // oxlint-disable-next-line no-array-index-key
                    key={idx}
                    disabled={actionItem.disabled}
                    icon={actionItem.icon}
                    // eslint-disable-next-line react/jsx-handler-names
                    onClick={actionItem.onHandle}
                    tone={actionItem.tone}
                    text={actionItem.label}
                  />
                ),
            )}
          </Stack>

          {documentActions.items.map((actionItem, idx) => {
            if (actionItem?.dialog && actionItem.dialog.type === 'dialog') {
              return (
                <Dialog
                  // oxlint-disable-next-line no-array-index-key
                  key={idx}
                  footer={actionItem.dialog.footer}
                  header={actionItem.dialog.header}
                  id={`document-action-modal-${idx}`}
                  // eslint-disable-next-line react/jsx-handler-names
                  onClose={actionItem.dialog.onClose}
                >
                  {actionItem.dialog.content}
                </Dialog>
              )
            }

            return null
          })}
        </>
      )}
    </Box>
  )
}

function useDocumentActions(documentId: string, schemaType: string, editState: EditStateFor) {
  const {document} = useSource()
  const actions = useMemo(
    () => document.actions({schemaType, documentId}),
    [document, documentId, schemaType],
  )
  const [descriptions, setDescriptions] = useState<Array<DocumentActionDescription | null> | null>(
    null,
  )

  const node = (
    <DocumentActionResolver
      actionHooks={actions}
      editState={editState}
      onUpdate={setDescriptions}
    />
  )

  return {items: descriptions, node}
}

function DocumentActionResolver(props: {
  actionHooks: DocumentActionComponent[]
  editState: EditStateFor
  onUpdate: (descs: Array<DocumentActionDescription | null>) => void
}) {
  const {actionHooks, editState, onUpdate} = props

  const [actionDescriptions, setActionDescriptions] = useState<
    Array<DocumentActionDescription | null>
  >(() => actionHooks.map(() => null))

  const updateDescription = useCallback((desc: DocumentActionDescription | null, idx: number) => {
    setActionDescriptions((arr) => {
      const copy = arr.slice(0)
      copy.splice(idx, 1, desc)
      return copy
    })
  }, [])

  useEffect(() => {
    onUpdate(actionDescriptions)
  }, [actionDescriptions, onUpdate])

  return (
    <>
      {actionHooks.map((actionHook, idx) => (
        <DocumentActionHook
          // oxlint-disable-next-line no-array-index-key
          key={idx}
          actionHook={actionHook}
          editState={editState}
          index={idx}
          onUpdate={updateDescription}
        />
      ))}
    </>
  )
}

function DocumentActionHook(props: {
  actionHook: DocumentActionComponent
  editState: EditStateFor
  index: number
  onUpdate: (desc: DocumentActionDescription | null, idx: number) => void
}) {
  const {actionHook: useActionDescription, editState, index, onUpdate} = props

  const onComplete = useCallback(() => {
    // @todo
  }, [])

  const actionProps: DocumentActionProps = useMemo(
    () => ({
      ...editState,
      onComplete,
      // @todo
      revision: undefined,
    }),
    [editState, onComplete],
  )

  const actionDescription = useUnique(useActionDescription(actionProps))

  useEffect(() => {
    onUpdate(actionDescription, index)
  }, [actionDescription, index, onUpdate])

  return null
}
