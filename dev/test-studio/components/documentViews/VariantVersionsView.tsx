import {LaunchIcon} from '@sanity/icons/Launch'
import {Box, Button, Card, Code, Dialog, Grid, Inline, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, combineLatest, map, of, type Observable} from 'rxjs'
import {
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  getTargetDocument,
  getVariantTitle,
  isRecord,
  useActiveReleases,
  useClient,
  useDateTimeFormat,
  useDocumentPreviewStore,
  useDocumentVersions,
  usePerspective,
} from 'sanity'

const DOCUMENT_QUERY = '*[_id == $id][0]'
const RAW_PERSPECTIVE_CLIENT_OPTIONS = {apiVersion: 'X' as const}

type VersionSnapshot = {
  _id?: string
  title?: string
  _updatedAt?: string
} | null

type VersionSlot = {
  label: string
  contextTitle?: string
  snapshot: VersionSnapshot
  status: 'loading' | 'not-found' | 'ready' | 'no-variant' | 'no-release'
}

type VersionSnapshots = {
  published: VersionSnapshot
  draft: VersionSnapshot
  variantPublished: VersionSnapshot
  variantDraft: VersionSnapshot
  release: VersionSnapshot
}

const EMPTY_SNAPSHOTS: VersionSnapshots = {
  published: null,
  draft: null,
  variantPublished: null,
  variantDraft: null,
  release: null,
}

const SNAPSHOT_PATHS = ['title', '_updatedAt', '_id'] as const

type DocumentJsonState = {
  document: unknown
  loading: boolean
  error?: string
}

const INITIAL_DOCUMENT_JSON_STATE: DocumentJsonState = {
  document: undefined,
  loading: true,
}

function buildDocumentQueryUrl(client: ReturnType<typeof useClient>, documentId: string): string {
  const searchParams = new URLSearchParams()
  searchParams.set('query', DOCUMENT_QUERY)
  searchParams.set('$id', JSON.stringify(documentId))
  searchParams.set('perspective', 'raw')

  return client.getUrl(client.getDataUrl('query', `?${searchParams.toString()}`))
}

function observeSnapshot(
  documentPreviewStore: ReturnType<typeof useDocumentPreviewStore>,
  id: string | undefined,
): Observable<VersionSnapshot> {
  if (!id) {
    return of(null)
  }

  return documentPreviewStore
    .observePaths({_id: id}, [...SNAPSHOT_PATHS])
    .pipe(map((value) => (isRecord(value) ? (value as VersionSnapshot) : null)))
}

function useVariantVersionSnapshots(documentId: string) {
  const publishedId = getPublishedId(documentId)
  const {versions, loading: versionsLoading} = useDocumentVersions({documentId: publishedId})
  const {selectedVariant, selectedReleaseId} = usePerspective()
  const {data: releases = []} = useActiveReleases()
  const documentPreviewStore = useDocumentPreviewStore()

  const variantTitle = selectedVariant ? getVariantTitle(selectedVariant) : undefined
  const selectedRelease = useMemo(
    () =>
      selectedReleaseId
        ? releases.find(
            (release) => getReleaseIdFromReleaseDocumentId(release._id) === selectedReleaseId,
          )
        : undefined,
    [releases, selectedReleaseId],
  )
  const releaseTitle = selectedRelease?.metadata.title?.trim() || selectedReleaseId || undefined

  const stubs = useMemo(() => {
    return {
      published: getTargetDocument({
        bundle: 'published',
        variant: undefined,
        documentVersions: versions,
      }),
      draft: getTargetDocument({bundle: 'drafts', variant: undefined, documentVersions: versions}),
      release: selectedReleaseId
        ? getTargetDocument({
            bundle: selectedReleaseId,
            variant: selectedVariant?._id,
            documentVersions: versions,
          })
        : undefined,
      variantPublished: selectedVariant
        ? getTargetDocument({
            bundle: 'published',
            variant: selectedVariant._id,
            documentVersions: versions,
          })
        : undefined,
      variantDraft: selectedVariant
        ? getTargetDocument({
            bundle: 'drafts',
            variant: selectedVariant._id,
            documentVersions: versions,
          })
        : undefined,
    }
  }, [selectedReleaseId, selectedVariant, versions])

  const snapshots$ = useMemo(
    () =>
      combineLatest({
        published: observeSnapshot(documentPreviewStore, stubs.published?._id),
        draft: observeSnapshot(documentPreviewStore, stubs.draft?._id),
        release: observeSnapshot(documentPreviewStore, stubs.release?._id),
        variantPublished: observeSnapshot(documentPreviewStore, stubs.variantPublished?._id),
        variantDraft: observeSnapshot(documentPreviewStore, stubs.variantDraft?._id),
      }),
    [documentPreviewStore, stubs],
  )

  const snapshots = useObservable(snapshots$, EMPTY_SNAPSHOTS)

  const slots: VersionSlot[] = useMemo(() => {
    const toSlot = (
      label: string,
      snapshot: VersionSnapshot,
      stubExists: boolean,
      options?: {
        requiresVariant?: boolean
        requiresRelease?: boolean
        contextTitle?: string
      },
    ): VersionSlot => {
      const {requiresVariant = false, requiresRelease = false, contextTitle} = options ?? {}

      if (versionsLoading) {
        return {label, contextTitle, snapshot: null, status: 'loading'}
      }

      if (requiresVariant && !selectedVariant) {
        return {label, contextTitle, snapshot: null, status: 'no-variant'}
      }

      if (requiresRelease && !selectedReleaseId) {
        return {label, contextTitle, snapshot: null, status: 'no-release'}
      }

      if (!stubExists) {
        return {label, contextTitle, snapshot: null, status: 'not-found'}
      }

      return {label, contextTitle, snapshot, status: 'ready'}
    }

    const orderedSlots: VersionSlot[] = [
      toSlot('Published', snapshots.published, Boolean(stubs.published)),
      toSlot('Draft', snapshots.draft, Boolean(stubs.draft)),
    ]

    if (selectedVariant) {
      orderedSlots.push(
        toSlot('Published variant', snapshots.variantPublished, Boolean(stubs.variantPublished), {
          requiresVariant: true,
          contextTitle: variantTitle,
        }),
      )
      orderedSlots.push(
        toSlot('Draft variant', snapshots.variantDraft, Boolean(stubs.variantDraft), {
          requiresVariant: true,
          contextTitle: variantTitle,
        }),
      )
    }

    if (selectedReleaseId) {
      orderedSlots.push(
        toSlot('Release variant', snapshots.release, Boolean(stubs.release), {
          requiresRelease: true,
          contextTitle: releaseTitle,
        }),
      )
    }

    return orderedSlots
  }, [
    releaseTitle,
    selectedReleaseId,
    selectedVariant,
    snapshots,
    stubs,
    variantTitle,
    versionsLoading,
  ])

  return {releaseTitle, selectedReleaseId, selectedVariant, slots, variantTitle, versionsLoading}
}

function formatUpdatedAt(
  dateFormatter: Intl.DateTimeFormat,
  updatedAt: string | undefined,
): string | undefined {
  if (!updatedAt) {
    return undefined
  }

  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return dateFormatter.format(date)
}

function observeFullDocument(
  documentPreviewStore: ReturnType<typeof useDocumentPreviewStore>,
  id: string,
): Observable<unknown> {
  return documentPreviewStore.unstable_observeDocument(id, {
    apiVersion: RAW_PERSPECTIVE_CLIENT_OPTIONS.apiVersion,
  })
}

function DocumentJsonDialog(props: {documentId: string; label: string; onClose: () => void}) {
  const {documentId, label, onClose} = props
  const documentPreviewStore = useDocumentPreviewStore()

  const documentState$ = useMemo(
    () =>
      observeFullDocument(documentPreviewStore, documentId).pipe(
        map(
          (result): DocumentJsonState => ({
            document: result ?? null,
            loading: false,
          }),
        ),
        catchError(
          (observeError: unknown): Observable<DocumentJsonState> =>
            of({
              document: undefined,
              loading: false,
              error:
                observeError instanceof Error ? observeError.message : 'Failed to load document',
            }),
        ),
      ),
    [documentId, documentPreviewStore],
  )

  const {document, loading, error} = useObservable(documentState$, INITIAL_DOCUMENT_JSON_STATE)

  return (
    <Dialog
      header={`${label} document`}
      id={`variant-versions-document-${documentId}`}
      onClose={onClose}
      open
      width={4}
    >
      <Box overflow="auto" padding={4} style={{maxHeight: '70vh'}}>
        {loading && (
          <Text muted size={1}>
            Loading document…
          </Text>
        )}
        {!loading && error && (
          <Text muted size={1}>
            {error}
          </Text>
        )}
        {!loading && !error && (
          <Code language="json" size={1}>
            {JSON.stringify(document, null, 2)}
          </Code>
        )}
      </Box>
    </Dialog>
  )
}

function VersionSlotCard({label, contextTitle, snapshot, status}: VersionSlot) {
  const client = useClient(RAW_PERSPECTIVE_CLIENT_OPTIONS)
  const dateFormatter = useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})
  const formattedUpdatedAt = formatUpdatedAt(dateFormatter, snapshot?._updatedAt)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined)
  const documentId = snapshot?._id
  const queryUrl = documentId ? buildDocumentQueryUrl(client, documentId) : undefined

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!documentId) {
      return
    }

    setDeleting(true)
    setDeleteError(undefined)

    try {
      await client.delete(documentId)
    } catch (deleteErr: unknown) {
      setDeleteError(deleteErr instanceof Error ? deleteErr.message : 'Failed to delete document')
    } finally {
      setDeleting(false)
    }
  }, [client, documentId])

  return (
    <>
      <Card padding={4} radius={2} shadow={2} tone="default">
        <Stack gap={3}>
          <Stack gap={1}>
            <Text size={2} weight="semibold">
              {label}
            </Text>
            {contextTitle && (
              <Text muted size={1}>
                {contextTitle}
              </Text>
            )}
          </Stack>
          {status === 'loading' && (
            <Text muted size={1}>
              Loading…
            </Text>
          )}
          {status === 'no-variant' && (
            <Text muted size={1}>
              Select a variant in the perspective bar
            </Text>
          )}
          {status === 'no-release' && (
            <Text muted size={1}>
              Select a release in the perspective bar
            </Text>
          )}
          {status === 'not-found' && (
            <Text muted size={1}>
              Not found
            </Text>
          )}
          {status === 'ready' && (
            <Stack gap={2}>
              <Inline>
                <Text size={1} weight="semibold">
                  Title:{' '}
                </Text>
                <Text size={1}>{snapshot?.title ?? <Text muted>(empty)</Text>}</Text>
              </Inline>
              <Inline>
                <Text size={1} weight="semibold">
                  Last updated at:{' '}
                </Text>
                <Text size={1}>{formattedUpdatedAt ?? <Text muted>(unknown)</Text>}</Text>
              </Inline>
              <Inline>
                <Text size={1} weight="semibold">
                  ID:{' '}
                </Text>
                <Text size={1}>{snapshot?._id ?? <Text muted>(unknown)</Text>}</Text>
              </Inline>
              {queryUrl && documentId && (
                <Stack gap={2}>
                  <Text size={1}>
                    <a href={queryUrl} rel="noopener noreferrer" target="_blank">
                      See document <LaunchIcon />
                    </a>
                  </Text>
                  <Button mode="ghost" onClick={handleOpenDialog} text="View document JSON" />
                  <Button
                    disabled={deleting}
                    mode="ghost"
                    onClick={handleDelete}
                    text={deleting ? 'Deleting…' : 'Delete version'}
                    tone="critical"
                  />
                  {deleteError && (
                    <Text muted size={1}>
                      {deleteError}
                    </Text>
                  )}
                </Stack>
              )}
            </Stack>
          )}
        </Stack>
      </Card>
      {dialogOpen && documentId && (
        <DocumentJsonDialog documentId={documentId} label={label} onClose={handleCloseDialog} />
      )}
    </>
  )
}

export function VariantVersionsView(props: {documentId: string}) {
  const {documentId} = props
  const {releaseTitle, selectedReleaseId, selectedVariant, slots, variantTitle, versionsLoading} =
    useVariantVersionSnapshots(documentId)

  return (
    <Card overflow="auto" style={{minHeight: '100%'}} tone="transparent">
      <Box padding={4}>
        <Stack space={4}>
          <Stack space={2}>
            <Text size={3} weight="bold">
              Variant versions
            </Text>
            <Text muted size={1}>
              Document group: {getPublishedId(documentId)}
            </Text>
            {selectedReleaseId && (
              <Text muted size={1}>
                Selected release: {releaseTitle ?? selectedReleaseId}
              </Text>
            )}
            {selectedVariant ? (
              <Text muted size={1}>
                Selected variant: {variantTitle ?? selectedVariant._id}
              </Text>
            ) : (
              <Text muted size={1}>
                No variant selected — variant slots require a variant in the perspective bar.
              </Text>
            )}
            {versionsLoading && (
              <Text muted size={1}>
                Resolving document versions…
              </Text>
            )}
          </Stack>
          <Grid columns={[1, 1, 2]} gap={4}>
            {slots.map((slot) => (
              <VersionSlotCard key={slot.label} {...slot} />
            ))}
          </Grid>
        </Stack>
      </Box>
    </Card>
  )
}
