import {AddIcon} from '@sanity/icons'
import {type IncomingReferencesOptions, type IncomingReferenceType} from '@sanity/types'
import {Box, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'

import {Button} from '../../../../../ui-components/button/Button'
import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {useClient} from '../../../../hooks/useClient'
import {useEditState} from '../../../../hooks/useEditState'
import {useSchema} from '../../../../hooks/useSchema'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {useDocumentPreviewStore} from '../../../../store/_legacy/datastores'
import {useSource} from '../../../../studio/source'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {getDraftId, getPublishedId, isPublishedId} from '../../../../util/draftUtils'
import {AddIncomingReference} from './AddIncomingReference'
import {CreateNewIncomingReference} from './CreateNewIncomingReference'
import {getIncomingReferences, INITIAL_STATE} from './getIncomingReferences'
import {IncomingReferenceDocument} from './IncomingReferenceDocument'

export function IncomingReferences({
  type,
  referenced,
  onLinkDocument,
  actions,
  shouldRenderTitle,
  fieldName,
  creationAllowed,
  filter,
  filterParams,
}: {
  shouldRenderTitle: boolean
  referenced: {id: string; type: string}
  fieldName: string
  type: IncomingReferenceType
  onLinkDocument: IncomingReferencesOptions['onLinkDocument']
  actions: IncomingReferencesOptions['actions']
  creationAllowed: IncomingReferencesOptions['creationAllowed']
  filter: IncomingReferencesOptions['filter']
  filterParams: IncomingReferencesOptions['filterParams']
}) {
  const documentPreviewStore = useDocumentPreviewStore()
  const {getClient} = useSource()

  const references$ = useMemo(
    () =>
      getIncomingReferences({
        documentId: referenced.id,
        documentPreviewStore,
        type: type.type,
        filter,
        filterParams,
        getClient,
      }),
    [documentPreviewStore, type, filter, filterParams, referenced.id, getClient],
  )

  const {documents, loading} = useObservable(references$, INITIAL_STATE)
  const schema = useSchema()
  const {t} = useTranslation()
  const schemaType = schema.get(type.type)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [isAdding, setIsAdding] = useState(false)
  const [newReferenceId, setNewReferenceId] = useState<string | null>(null)
  const editState = useEditState(referenced.id, referenced.type)
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
  if (loading) {
    return <LoadingBlock showText title={'Loading documents'} />
  }
  return (
    <Stack space={2} marginBottom={2}>
      {shouldRenderTitle && (
        <Box paddingY={2} paddingX={0}>
          <Text size={1} weight="medium">
            {type.title || schemaType?.title}
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
                {t('incoming-references.input.no-items')}
              </Text>
            </Flex>
          </>
        )}

        {newReferenceId && (
          <SanityDefaultPreview icon={schemaType.icon} layout={'default'} isPlaceholder />
        )}
        {isAdding && (
          <AddIncomingReference
            type={type.type}
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
          text={t('incoming-references.input.add-reference-item')}
        />
      ) : (
        <CreateNewIncomingReference
          type={type.type}
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
