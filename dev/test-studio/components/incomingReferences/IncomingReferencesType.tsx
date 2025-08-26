import {AddIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getDraftId,
  getPublishedId,
  isPublishedId,
  SanityDefaultPreview,
  type SanityDocument,
  useClient,
  useSchema,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {AddIncomingReference} from './AddIncomingReference'
import {CreateNewIncomingReference} from './CreateNewIncomingReference'
import {IncomingReferenceDocument} from './IncomingReferenceDocument'
import {type LinkedDocumentActions, type OnLinkDocumentCallback} from './types'

export function IncomingReferencesType({
  type,
  documents = [],
  referenced,
  onLinkDocument,
  actions,
  shouldRenderTitle,
}: {
  type: string
  shouldRenderTitle: boolean
  documents: SanityDocument[] | undefined
  referenced: {
    id: string
    type: string
  }
  onLinkDocument: OnLinkDocumentCallback | undefined
  actions: LinkedDocumentActions | undefined
}) {
  const schema = useSchema()
  const schemaType = schema.get(type)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [isAdding, setIsAdding] = useState(false)
  const [newReferenceId, setNewReferenceId] = useState<string | null>(null)
  const {editState} = useDocumentPane()
  const toast = useToast()
  const handleAdd = useCallback(() => {
    setIsAdding((p) => !p)
  }, [])

  const publishedExists = Boolean(editState?.published)

  const handleCreateNewReference = useCallback(async (documentId: string) => {
    setIsAdding(false)
    setNewReferenceId(documentId)
  }, [])

  const handleLinkDocument = useCallback(
    async (documentId: string) => {
      setIsAdding(false)
      setNewReferenceId(documentId)

      const document = await client.fetch(`*[_id == "${documentId}"][0]`)

      const linkedDocument = onLinkDocument?.(document, {
        _type: 'reference',
        _ref: getPublishedId(referenced.id),
        ...(publishedExists ? {} : {_weak: true, _strengthenOnPublish: {type: referenced.type}}),
      })
      if (!linkedDocument) {
        setNewReferenceId(null)
        toast.push({
          title: 'Not possible to link to document',
          description: 'The document you are trying to link cannot be linked to',
          status: 'error',
        })
        return
      }

      // if the document is published and the schema is not live edit, we want to update the draft id, not the published id
      // If it's a version, we can update the version document.
      if (isPublishedId(documentId) && !schemaType?.liveEdit) {
        linkedDocument._id = getDraftId(documentId)
      }
      await client.createOrReplace(linkedDocument)
    },
    [
      client,
      onLinkDocument,
      referenced.id,
      referenced.type,
      publishedExists,
      schemaType?.liveEdit,
      toast,
    ],
  )

  useEffect(() => {
    if (documents.length > 0 && newReferenceId) {
      // new reference is now part of the documents, we need to remove it form the newReferenceId state
      const isAdded = documents.find(
        (document) => getPublishedId(document._id) === getPublishedId(newReferenceId),
      )
      if (isAdded) setNewReferenceId(null)
    }
  }, [documents, newReferenceId])
  if (!schemaType) return null
  return (
    <Stack key={type} space={2} marginBottom={2}>
      {shouldRenderTitle && (
        <Box paddingY={2} paddingX={0}>
          <Text size={1} weight="medium">
            {schemaType?.title}
          </Text>
        </Box>
      )}
      <Card radius={2} padding={1} border tone="default">
        {documents.length > 0 ? (
          <Stack space={1}>
            {documents.map((document) => (
              <IncomingReferenceDocument
                key={document._id}
                document={document}
                referenceToId={referenced.id}
                actions={actions}
              />
            ))}
          </Stack>
        ) : (
          <>
            <Flex
              align="center"
              justify="center"
              padding={1}
              hidden={isAdding || Boolean(newReferenceId)}
            >
              <Text size={1} muted>
                No items
              </Text>
            </Flex>
          </>
        )}

        {newReferenceId && (
          <SanityDefaultPreview icon={schemaType.icon} layout={'default'} isPlaceholder />
        )}
        {isAdding && (
          <AddIncomingReference
            type={type}
            referenced={referenced}
            onCreateNewReference={handleCreateNewReference}
            onLinkDocument={handleLinkDocument}
          />
        )}
      </Card>
      {onLinkDocument ? (
        <Button
          disabled={false}
          icon={AddIcon}
          mode="ghost"
          space={3}
          padding={3}
          onClick={handleAdd}
          text="Add item"
        />
      ) : (
        <CreateNewIncomingReference
          type={type}
          referenceToId={referenced.id}
          referenceToType={referenced.type}
          // TODO: Add option to disable new references.
          disableNew={false}
          onCreateNewReference={handleCreateNewReference}
        />
      )}
    </Stack>
  )
}
