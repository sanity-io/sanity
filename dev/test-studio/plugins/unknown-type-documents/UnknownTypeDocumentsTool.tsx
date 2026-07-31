import {RefreshIcon} from '@sanity/icons/Refresh'
import {TrashIcon} from '@sanity/icons/Trash'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Dialog,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient, useSchema} from 'sanity'

const API_VERSION = '2025-02-19'

/**
 * Excludes system documents — they must never be deleted from here:
 * - anything under the `_.**` id path (releases `_.releases.*`, variants
 *   `_.variants.*`, permission groups, retention policies, schemas, …)
 * - anything with a `system.*` type (`system.release`, `system.variant`,
 *   `system.group`, `system.retention`, `system.schema`, …)
 */
const NON_SYSTEM_FILTER = '!(_id in path("_.**")) && !string::startsWith(_type, "system.")'

/** Max number of documents listed in the UI ("Delete all" is not limited by this) */
const MAX_LISTED_DOCUMENTS = 500

/** Number of documents deleted per transaction when deleting all */
const DELETE_BATCH_SIZE = 100

interface UnknownDocument {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
}

interface UnknownDocsState {
  status: 'loading' | 'ready' | 'error'
  error?: string
  documents: UnknownDocument[]
  totalCount: number
  unknownTypes: string[]
}

const INITIAL_STATE: UnknownDocsState = {
  status: 'loading',
  documents: [],
  totalCount: 0,
  unknownTypes: [],
}

export function UnknownTypeDocumentsTool() {
  const client = useClient({apiVersion: API_VERSION})
  const schema = useSchema()
  const toast = useToast()

  const [state, setState] = useState<UnknownDocsState>(INITIAL_STATE)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set())
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [deleteAllProgress, setDeleteAllProgress] = useState<string | null>(null)

  const schemaTypeNames = useMemo(() => new Set(schema.getTypeNames()), [schema])

  const loadDocuments = useCallback(async () => {
    try {
      // Every distinct `_type` present in the dataset (drafts + published + versions)
      const allTypes = await client.fetch<string[]>(`array::unique(*[${NON_SYSTEM_FILTER}]._type)`)
      const unknownTypes = allTypes
        .filter((typeName) => !schemaTypeNames.has(typeName))
        .sort((a, b) => a.localeCompare(b))

      if (unknownTypes.length === 0) {
        setState({status: 'ready', documents: [], totalCount: 0, unknownTypes: []})
        return
      }

      const [totalCount, documents] = await Promise.all([
        client.fetch<number>(`count(*[_type in $types && ${NON_SYSTEM_FILTER}])`, {
          types: unknownTypes,
        }),
        client.fetch<UnknownDocument[]>(
          `*[_type in $types && ${NON_SYSTEM_FILTER}]{_id, _type, _createdAt, _updatedAt} | order(_type asc, _id asc) [0...${MAX_LISTED_DOCUMENTS}]`,
          {types: unknownTypes},
        ),
      ])

      setState({status: 'ready', documents, totalCount, unknownTypes})
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      }))
    }
  }, [client, schemaTypeNames])

  useEffect(() => {
    // Intentional load-on-mount for this dev tool
    // oxlint-disable-next-line react/react-compiler
    void loadDocuments()
  }, [loadDocuments])

  const refresh = useCallback(() => {
    setState((prev) => ({...prev, status: 'loading', error: undefined}))
    void loadDocuments()
  }, [loadDocuments])

  /** Deletes a single document by its `_id` */
  const deleteDocument = useCallback(
    async (id: string) => {
      setDeletingIds((prev) => new Set(prev).add(id))
      try {
        await client.delete(id)
        toast.push({status: 'success', title: `Deleted ${id}`})
        setState((prev) => ({
          ...prev,
          documents: prev.documents.filter((doc) => doc._id !== id),
          totalCount: Math.max(0, prev.totalCount - 1),
        }))
      } catch (err) {
        toast.push({
          status: 'error',
          title: `Failed to delete ${id}`,
          description: err instanceof Error ? err.message : String(err),
        })
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [client, toast],
  )

  /** Deletes every document whose `_type` is not in the schema, in batched transactions */
  const deleteAllDocuments = useCallback(async () => {
    setConfirmDeleteAll(false)
    setDeleteAllProgress('Fetching document ids…')
    try {
      const ids = await client.fetch<string[]>(`*[_type in $types && ${NON_SYSTEM_FILTER}]._id`, {
        types: state.unknownTypes,
      })
      const failedIds: string[] = []
      let deleted = 0

      for (let i = 0; i < ids.length; i += DELETE_BATCH_SIZE) {
        const batch = ids.slice(i, i + DELETE_BATCH_SIZE)
        setDeleteAllProgress(`Deleting ${Math.min(i + batch.length, ids.length)} of ${ids.length}…`)
        try {
          let tx = client.transaction()
          for (const id of batch) {
            tx = tx.delete(id)
          }
          // Default (sync) visibility so the reload below sees the deletions
          await tx.commit()
          deleted += batch.length
        } catch {
          // The batch failed as a whole (e.g. one doc has incoming references) —
          // retry one by one so only the actually undeletable documents remain
          for (const id of batch) {
            try {
              await client.delete(id)
              deleted++
            } catch {
              failedIds.push(id)
            }
          }
        }
      }

      if (failedIds.length > 0) {
        toast.push({
          status: 'warning',
          title: `Deleted ${deleted} documents, ${failedIds.length} failed`,
          description:
            'Some documents could not be deleted (most likely because other documents reference them).',
        })
      } else {
        toast.push({status: 'success', title: `Deleted ${deleted} documents`})
      }
    } catch (err) {
      toast.push({
        status: 'error',
        title: 'Delete all failed',
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setDeleteAllProgress(null)
      await loadDocuments()
    }
    // oxlint-disable-next-line react/react-compiler
  }, [client, state.unknownTypes, toast, loadDocuments])

  const documentsByType = useMemo(() => {
    const groups = new Map<string, UnknownDocument[]>()
    for (const doc of state.documents) {
      const group = groups.get(doc._type)
      if (group) {
        group.push(doc)
      } else {
        groups.set(doc._type, [doc])
      }
    }
    return groups
  }, [state.documents])

  const isBusy = state.status === 'loading' || deleteAllProgress !== null

  return (
    <Card height="fill" overflow="auto" padding={4} sizing="border">
      <Container width={2}>
        <Stack space={4}>
          <Flex align="center" gap={3}>
            <Box flex={1}>
              <Stack space={3}>
                <Heading as="h1" size={2}>
                  Documents with unknown types
                </Heading>
                <Text muted size={1}>
                  Documents in this dataset whose <code>_type</code> does not match any type
                  registered in the workspace schema.
                </Text>
              </Stack>
            </Box>
            <Button
              disabled={isBusy}
              icon={RefreshIcon}
              mode="ghost"
              onClick={refresh}
              text="Refresh"
            />
            <Button
              disabled={isBusy || state.totalCount === 0}
              icon={TrashIcon}
              onClick={() => setConfirmDeleteAll(true)}
              text={`Delete all (${state.totalCount})`}
              tone="critical"
            />
          </Flex>

          <Card border padding={3} radius={2} tone="caution">
            <Flex align="flex-start" gap={3}>
              <Text size={1}>
                <WarningOutlineIcon />
              </Text>
              <Text size={1}>
                Deleting documents is permanent. Some unknown types may belong to plugins or older
                tooling — review the list before deleting everything.
              </Text>
            </Flex>
          </Card>

          {deleteAllProgress !== null && (
            <Card border padding={3} radius={2} tone="critical">
              <Flex align="center" gap={3}>
                <Spinner muted />
                <Text size={1}>{deleteAllProgress}</Text>
              </Flex>
            </Card>
          )}

          {state.status === 'loading' && (
            <Flex align="center" gap={3} padding={4}>
              <Spinner muted />
              <Text muted size={1}>
                Scanning dataset for unknown document types…
              </Text>
            </Flex>
          )}

          {state.status === 'error' && (
            <Card border padding={3} radius={2} tone="critical">
              <Text size={1}>Failed to load documents: {state.error}</Text>
            </Card>
          )}

          {state.status === 'ready' && state.totalCount === 0 && (
            <Card border padding={4} radius={2} tone="positive">
              <Text size={1}>
                No documents found with a type outside the schema. Nothing to clean up! 🎉
              </Text>
            </Card>
          )}

          {state.status === 'ready' && state.totalCount > 0 && (
            <Stack space={4}>
              {state.totalCount > state.documents.length && (
                <Text muted size={1}>
                  Showing the first {state.documents.length} of {state.totalCount} documents.
                  "Delete all" removes every document, including the ones not listed.
                </Text>
              )}

              {[...documentsByType.entries()].map(([typeName, docs]) => (
                <Card border key={typeName} radius={2}>
                  <Card borderBottom padding={3} radius={2} tone="transparent">
                    <Flex align="center" gap={3}>
                      <Box flex={1}>
                        <Text size={1} weight="semibold">
                          <code>{typeName}</code>
                        </Text>
                      </Box>
                      <Badge tone="caution">
                        {docs.length} document{docs.length === 1 ? '' : 's'}
                      </Badge>
                    </Flex>
                  </Card>
                  <Stack padding={2} space={1}>
                    {docs.map((doc) => (
                      <Flex align="center" gap={3} key={doc._id} paddingX={2} paddingY={1}>
                        <Box flex={1}>
                          <Stack space={2}>
                            <Text size={1} textOverflow="ellipsis">
                              <code>{doc._id}</code>
                            </Text>
                            <Text muted size={0}>
                              Updated {new Date(doc._updatedAt).toLocaleString()}
                            </Text>
                          </Stack>
                        </Box>
                        <Button
                          disabled={isBusy || deletingIds.has(doc._id)}
                          icon={TrashIcon}
                          loading={deletingIds.has(doc._id)}
                          mode="ghost"
                          onClick={() => deleteDocument(doc._id)}
                          text="Delete"
                          tone="critical"
                        />
                      </Flex>
                    ))}
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>

      {confirmDeleteAll && (
        <Dialog
          footer={
            <Flex gap={2} justify="flex-end" padding={3}>
              <Button mode="ghost" onClick={() => setConfirmDeleteAll(false)} text="Cancel" />
              <Button
                icon={TrashIcon}
                onClick={deleteAllDocuments}
                text={`Delete ${state.totalCount} documents`}
                tone="critical"
              />
            </Flex>
          }
          header="Delete all documents with unknown types?"
          id="confirm-delete-all-unknown"
          onClose={() => setConfirmDeleteAll(false)}
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text size={1}>
                This permanently deletes all {state.totalCount} documents across{' '}
                {state.unknownTypes.length} unknown type{state.unknownTypes.length === 1 ? '' : 's'}
                : <code>{state.unknownTypes.join(', ')}</code>
              </Text>
              <Text size={1} weight="semibold">
                This cannot be undone.
              </Text>
            </Stack>
          </Box>
        </Dialog>
      )}
    </Card>
  )
}
