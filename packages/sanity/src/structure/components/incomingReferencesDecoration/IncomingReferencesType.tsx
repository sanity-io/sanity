import {AddIcon} from '@sanity/icons/Add'
import {type SanityDocument, type SchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {Suspense, use, useCallback, useEffect, useMemo, useState} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
import {
  CommandList,
  type CommandListRenderItemCallback,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getDraftId,
  getPublishedId,
  isPublishedId,
  LoadingBlock,
  SanityDefaultPreview,
  useClient,
  useDocumentPreviewStore,
  useSchema,
  useSource,
  useTranslation,
} from 'sanity'
import {Flex, Box} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {structureLocaleNamespace} from '../../i18n'
import {useDocumentPane} from '../../panes/document/useDocumentPane'
import {AddIncomingReference} from './AddIncomingReference'
import {CreateNewIncomingReference} from './CreateNewIncomingReference'
import {getIncomingReferences} from './getIncomingReferences'
import {IncomingReferenceDocument} from './IncomingReferenceDocument'
import {INCOMING_REFERENCES_ITEM_HEIGHT, IncomingReferencesListContainer} from './shared'
import {type IncomingReferencesOptions, type IncomingReferenceType} from './types'

export function IncomingReferencesType({
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
  const {displayed} = useDocumentPane()
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {getClient} = useSource()
  const displayedId = displayed?._id as string
  /**
   * `filter` is a function or a string, if it's a function it will get a new reference on every render
   * `filterParams` is an object, so it will also get a new reference on every render.
   *
   * If they are not memoized the `references$` observable will be recreated on every render,
   * causing the list to jump even when the resolved GROQ filter is unchanged.
   *
   * It is safe to capture the initial values here because both come from the schema, not
   * from React render state. Schema changes reload the studio, so pinning the first reference for this mount
   * does not stale meaningful configuration.
   */
  const [memoizedFilter] = useState(() => filter)
  const [memoizedFilterParams] = useState(() => filterParams)

  const references$ = useMemo(
    () =>
      getIncomingReferences({
        documentId: displayedId,
        documentPreviewStore,
        type: type.type,
        filter: memoizedFilter,
        filterParams: memoizedFilterParams,
        getClient,
      }),
    [documentPreviewStore, type.type, memoizedFilter, memoizedFilterParams, displayedId, getClient],
  )

  const referencesPromise = useObservablePromise(references$)

  const schema = useSchema()
  const {t} = useTranslation(structureLocaleNamespace)
  const schemaType = schema.get(type.type)

  if (!schemaType) return null
  return (
    <Suspense
      fallback={<LoadingBlock showText title={t('incoming-references-input.types-loading')} />}
    >
      <IncomingReferencesTypeList
        actions={actions}
        creationAllowed={creationAllowed}
        fieldName={fieldName}
        onLinkDocument={onLinkDocument}
        referenced={referenced}
        referencesPromise={referencesPromise}
        schemaType={schemaType}
        shouldRenderTitle={shouldRenderTitle}
        type={type}
      />
    </Suspense>
  )
}

function IncomingReferencesTypeList({
  type,
  referenced,
  onLinkDocument,
  actions,
  shouldRenderTitle,
  fieldName,
  creationAllowed,
  referencesPromise,
  schemaType,
}: {
  shouldRenderTitle: boolean
  referenced: {id: string; type: string}
  fieldName: string
  type: IncomingReferenceType
  onLinkDocument: IncomingReferencesOptions['onLinkDocument']
  actions: IncomingReferencesOptions['actions']
  creationAllowed: IncomingReferencesOptions['creationAllowed']
  referencesPromise: ObservablePromise<SanityDocument[]>
  schemaType: SchemaType
}) {
  const documents = use(referencesPromise)

  const {t} = useTranslation(structureLocaleNamespace)
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
      try {
        const liveEdit = Boolean(schemaType?.liveEdit)
        const document = await client.fetch('*[_id == $id][0]', {id: documentId})

        const linkedDocument = onLinkDocument?.(document, {
          _type: 'reference',
          _ref: getPublishedId(referenced.id),
          ...(publishedExists ? {} : {_weak: true, _strengthenOnPublish: {type: referenced.type}}),
        })
        if (!linkedDocument) {
          toast.push({
            title: 'Not possible to link to document',
            description: 'The document you are trying to link cannot be linked to',
            status: 'error',
          })
        } else {
          // if the document is published and the schema is not live edit, we want to update the draft id, not the published id
          // If it's a version, we can update the version document.
          if (isPublishedId(documentId) && !liveEdit) {
            linkedDocument._id = getDraftId(documentId)
          }
          await client.createOrReplace(linkedDocument)
        }
      } catch (err) {
        // The fetch or write failed (e.g. insufficient permissions) —
        // tell the user.
        console.error(err)
        toast.push({
          title: 'Failed to link document',
          description: err instanceof Error ? err.message : undefined,
          status: 'error',
        })
      }
      // Always clear the optimistic placeholder. The effect below also clears
      // it once the linked document shows up in `documents`, but that never
      // happens if the references stream has degraded to an empty list (e.g.
      // after a load error), so don't rely on it alone.
      setNewReferenceId(null)
    },
    [client, onLinkDocument, referenced, publishedExists, toast, schemaType],
  )

  useEffect(() => {
    if (documents.length > 0 && newReferenceId) {
      // new reference is now part of the documents, we need to remove it from the newReferenceId state
      const isAdded = documents.find(
        (document) => getPublishedId(document._id) === getPublishedId(newReferenceId),
      )
      // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
      if (isAdded) setNewReferenceId(null)
    }
  }, [documents, newReferenceId])

  const renderItem = useCallback<CommandListRenderItemCallback<SanityDocument>>(
    (document) => (
      <IncomingReferenceDocument
        document={document}
        referenceToId={referenced.id}
        actions={actions}
      />
    ),
    [referenced.id, actions],
  )

  return (
    <Stack gap={2} marginBottom={2}>
      {shouldRenderTitle && (
        <Box paddingY={2} paddingX={0}>
          <Text size={1} weight="medium">
            {type.title || schemaType?.title}
          </Text>
        </Box>
      )}
      <Card radius={2} padding={1} border tone="default">
        {documents.length > 0 ? (
          <IncomingReferencesListContainer $itemCount={documents.length}>
            <CommandList
              activeItemDataAttr="data-hovered"
              ariaLabel={t('incoming-references-input.list-label', {
                type: type.title || schemaType?.title,
              })}
              canReceiveFocus
              fixedHeight
              getItemKey={(index) => documents[index]._id}
              itemHeight={INCOMING_REFERENCES_ITEM_HEIGHT}
              items={documents}
              onlyShowSelectionWhenActive
              overscan={5}
              renderItem={renderItem}
              wrapAround={false}
            />
          </IncomingReferencesListContainer>
        ) : (
          <>
            <Flex
              alignItems="center"
              justifyContent="center"
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
          text={t('incoming-references-input.add-reference-item')}
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
