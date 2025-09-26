import {AddIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
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
  useTranslation,
} from 'sanity'

import {Button} from '../../../ui-components/button/Button'
import {structureLocaleNamespace} from '../../i18n'
import {useDocumentPane} from '../../panes/document/useDocumentPane'
import {AddIncomingReference} from './AddIncomingReference'
import {CreateNewIncomingReference} from './CreateNewIncomingReference'
import {IncomingReferenceDocument} from './IncomingReferenceDocument'
import {type IncomingReferencesOptions} from './types'

export function IncomingReferencesType({
  type,
  documents = [],
  referenced,
  onLinkDocument,
  actions,
  shouldRenderTitle,
  fieldName,
  creationAllowed,
}: {
  type: string
  shouldRenderTitle: boolean
  documents: SanityDocument[] | undefined
  referenced: {
    id: string
    type: string
  }
  onLinkDocument: IncomingReferencesOptions['onLinkDocument']
  actions: IncomingReferencesOptions['actions']
  creationAllowed: IncomingReferencesOptions['creationAllowed']
  fieldName: string
}) {
  const schema = useSchema()
  const {t} = useTranslation(structureLocaleNamespace)
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
      const liveEdit = Boolean(schemaType?.liveEdit)
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
      if (isPublishedId(documentId) && !liveEdit) {
        linkedDocument._id = getDraftId(documentId)
      }
      await client.createOrReplace(linkedDocument)
    },
    [client, onLinkDocument, referenced, publishedExists, toast, schemaType?.liveEdit],
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
              padding={2}
              hidden={isAdding || Boolean(newReferenceId)}
            >
              <Text size={1} muted>
                {t('incoming-references-input.no-items')}
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
            creationAllowed={creationAllowed}
            fieldName={fieldName}
          />
        )}
      </Card>
      {onLinkDocument ? (
        <Button
          size="large"
          disabled={false}
          icon={AddIcon}
          mode="ghost"
          onClick={handleAdd}
          text={t('incoming-references-input.add-reference-item')}
        />
      ) : (
        <CreateNewIncomingReference
          type={type}
          referenceToId={referenced.id}
          referenceToType={referenced.type}
          creationAllowed={creationAllowed}
          onCreateNewReference={handleCreateNewReference}
          fieldName={fieldName}
        />
      )}
    </Stack>
  )
}
