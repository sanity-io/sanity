import {LaunchIcon} from '@sanity/icons/Launch'
import {SearchIcon} from '@sanity/icons/Search'
import {SyncIcon} from '@sanity/icons/Sync'
import {
  Badge,
  Box,
  Button,
  Card,
  Code,
  Flex,
  Heading,
  Inline,
  Spinner,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import {
  type ComponentPropsWithoutRef,
  type FormEvent,
  type ForwardedRef,
  forwardRef,
  useCallback,
  useMemo,
  useState,
} from 'react'
import {
  getPublishedId,
  useActiveReleases,
  useAllVariants,
  useDocumentVersions,
  usePerspective,
  useSetPerspective,
  useSetVariant,
  type SystemVariant,
  type VersionInfoDocumentStub,
} from 'sanity'
import {IntentLink, useRouter} from 'sanity/router'

import {AnimatedGridCellDocument} from './AnimatedGridCellDocument'
import {
  buildCellIndex,
  buildColumns,
  buildRows,
  getCellDocuments,
  getStubBundleId,
  getStubVariantId,
  getVariantDocumentId,
  toVariantDocumentId,
  type GridColumn,
  type GridRow,
} from './buildGrid'
import {GROUP_DOCUMENT_QUERY} from './constants'
import {type ResolvedDocument, useContentLakeDocument} from './useContentLakeDocument'

const ROW_HEADER_WIDTH = 200
const COLUMN_MIN_WIDTH = 240

/**
 * A studio tool that visualizes how document variants work: every document of a group laid out
 * on a grid — one column per variant (default first), one row per bundle (published, drafts,
 * then releases stacked like the releases perspective picker). The studio navbar's perspective
 * and variant pickers drive a real Content Lake query (`*[_id == $id][0]` plus `perspective` and
 * `variant` request parameters), and the document the API returns is highlighted on the grid —
 * resolution happens entirely server-side, not in the studio.
 */
export function VariantsGridTool() {
  const router = useRouter()
  const docIdFromRoute = typeof router.state.docId === 'string' ? router.state.docId : ''

  const handleLoadDocument = useCallback(
    (documentId: string) => {
      router.navigate({docId: getPublishedId(documentId)})
    },
    [router],
  )

  const groupId = docIdFromRoute ? getPublishedId(docIdFromRoute) : ''

  return (
    <Card height="fill" minWidth={0} overflow="auto" tone="transparent">
      <Box padding={[4, 5]}>
        <Stack space={5}>
          <Stack space={3}>
            <Heading as="h1" size={2}>
              Variants grid
            </Heading>
            <Text muted size={1}>
              Enter a document id to lay out its whole document group: variants as columns, bundles
              (published, drafts, releases) as rows. Use the perspective and variant pickers in the
              studio navbar — Content Lake resolves the query server-side, and the returned document
              is highlighted on the grid.
            </Text>
          </Stack>

          <DocumentIdForm
            key={docIdFromRoute || 'empty'}
            groupId={groupId || undefined}
            initialDocId={docIdFromRoute}
            onLoad={handleLoadDocument}
          />

          {groupId ? (
            <GridExplorer key={groupId} groupId={groupId} />
          ) : (
            <Card border padding={4} radius={3} tone="transparent">
              <Text align="center" muted size={1}>
                No document loaded yet.
              </Text>
            </Card>
          )}
        </Stack>
      </Box>
    </Card>
  )
}

function DocumentIdForm(props: {
  groupId: string | undefined
  initialDocId: string
  onLoad: (documentId: string) => void
}) {
  const {groupId, initialDocId, onLoad} = props
  const [idInput, setIdInput] = useState(initialDocId)

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmed = idInput.trim()
      if (!trimmed) {
        return
      }
      onLoad(trimmed)
    },
    [idInput, onLoad],
  )

  return (
    <form onSubmit={handleSubmit}>
      <Flex gap={2} align="center">
        <Box flex={1}>
          <TextInput
            fontSize={1}
            icon={SearchIcon}
            onChange={(event) => setIdInput(event.currentTarget.value)}
            placeholder="Document id (published, draft or version id — normalized to the group id)"
            value={idInput}
          />
        </Box>
        {groupId ? <OpenInStructureButton groupId={groupId} /> : null}
        <Button
          disabled={!idInput.trim()}
          fontSize={1}
          mode="default"
          text="Load group"
          tone="primary"
          type="submit"
        />
      </Flex>
    </form>
  )
}

const StructureIntentLink = forwardRef(function StructureIntentLink(
  {
    documentType,
    groupId,
    searchParams,
    ...linkProps
  }: {
    documentType: string
    groupId: string
    searchParams: Array<[string, string]> | undefined
  } & ComponentPropsWithoutRef<'a'>,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  return (
    <IntentLink
      {...linkProps}
      intent="edit"
      params={{
        id: groupId,
        type: documentType,
      }}
      searchParams={searchParams}
      ref={ref}
    />
  )
})

function getStructureEditSearchParams(
  bundleId: string,
  variantName: string | undefined,
): Array<[string, string]> | undefined {
  const searchParams: Array<[string, string]> = variantName ? [['variant', variantName]] : []

  if (bundleId === 'published' || !bundleId) {
    return [...searchParams, ['perspective', 'published']]
  }

  if (bundleId === 'drafts') {
    return searchParams.length > 0 ? searchParams : undefined
  }

  return [...searchParams, ['perspective', bundleId]]
}

function OpenInStructureButton({groupId}: {groupId: string}) {
  const {versions, loading: versionsLoading} = useDocumentVersions({documentId: groupId})
  const {bundle, selectedVariantName, perspectiveStack} = usePerspective()

  const perspective = perspectiveStack.length > 0 ? perspectiveStack.join(',') : 'published'
  const hasDocuments = !versionsLoading && versions.length > 0

  const {document: typeDocument, loading: typeLoading} = useContentLakeDocument({
    query: '*[_id == $id][0]{_type}',
    params: useMemo(() => ({id: groupId}), [groupId]),
    perspective,
    variantName: selectedVariantName,
    enabled: hasDocuments,
  })

  const searchParams = useMemo(
    () => getStructureEditSearchParams(bundle, selectedVariantName),
    [bundle, selectedVariantName],
  )

  const documentType = typeDocument?._type

  if (!hasDocuments || typeLoading || !documentType) {
    return null
  }

  return (
    <Button
      as={StructureIntentLink}
      documentType={documentType}
      fontSize={1}
      groupId={groupId}
      icon={LaunchIcon}
      mode="ghost"
      searchParams={searchParams}
      text="Open in Structure"
      title="Open this document in the Structure tool with the current perspective and variant"
    />
  )
}

function GridExplorer({groupId}: {groupId: string}) {
  const {
    versions,
    loading: versionsLoading,
    error: versionsError,
  } = useDocumentVersions({documentId: groupId})
  const {data: releases} = useActiveReleases()
  const {data: variants} = useAllVariants()
  const {
    perspectiveStack,
    selectedVariantName,
    selectedVariant,
    bundle: selectedBundle,
  } = usePerspective()

  const perspective = perspectiveStack.length > 0 ? perspectiveStack.join(',') : 'published'

  const queryParams = useMemo(() => ({id: groupId}), [groupId])
  const {
    document: resolvedDocument,
    loading: queryLoading,
    error: queryError,
    requestUrl,
    refetch,
  } = useContentLakeDocument({
    query: GROUP_DOCUMENT_QUERY,
    params: queryParams,
    perspective,
    variantName: selectedVariantName,
    enabled: Boolean(groupId),
  })

  const columns = useMemo(
    () => buildColumns({versions, variants, selectedVariantId: selectedVariantName}),
    [versions, variants, selectedVariantName],
  )
  const rows = useMemo(
    () =>
      buildRows({
        versions,
        releases,
        selectedPerspective: selectedBundle,
        perspectiveStack,
      }),
    [versions, releases, selectedBundle, perspectiveStack],
  )
  const cellIndex = useMemo(() => buildCellIndex(versions), [versions])

  // The version document the query returned. Perspectives normalize `_id` to the group id and
  // carry the real id in `_originalId`; the `_rev` comparison is a safety net for responses
  // where `_originalId` is absent.
  const highlightedStub = useMemo(() => {
    if (!resolvedDocument) return undefined
    const matchedId = resolvedDocument._originalId ?? resolvedDocument._id
    const byId = versions.find((stub) => stub._id === matchedId)
    if (byId) return byId
    return versions.find((stub) => stub._rev === resolvedDocument._rev)
  }, [resolvedDocument, versions])

  const setVariant = useSetVariant()
  const setPerspective = useSetPerspective()

  const handleSelectCell = useCallback(
    (options: {bundleId: string; variantDocumentId: SystemVariant['_id'] | undefined}) => {
      setVariant({
        variantId: options.variantDocumentId,
        perspective: options.bundleId as 'drafts' | 'published' | (string & {}),
      })
    },
    [setVariant],
  )

  const handleSelectColumn = useCallback(
    (variantId: string | undefined) => {
      setVariant({variantId: toVariantDocumentId(variantId)})
    },
    [setVariant],
  )

  const handleSelectRow = useCallback(
    (bundleId: string) => {
      setPerspective(bundleId as 'drafts' | 'published' | (string & {}))
    },
    [setPerspective],
  )

  if (versionsError) {
    const message =
      versionsError instanceof Error ? versionsError.message : JSON.stringify(versionsError)
    return (
      <Card border padding={4} radius={3} tone="critical">
        <Text size={1}>Failed to load document versions: {message}</Text>
      </Card>
    )
  }

  return (
    <Stack space={5}>
      <Card border padding={3} radius={3}>
        <Flex align="center" gap={3} justify="space-between" wrap="wrap">
          <Stack space={2}>
            <Text muted size={1} weight="medium">
              Query driven by studio navbar
            </Text>
            <Inline space={2}>
              <Badge mode="outline">perspective: {perspective}</Badge>
              <Badge mode="outline">
                variant:{' '}
                {selectedVariantName
                  ? selectedVariant?.metadata?.title || selectedVariantName
                  : 'default'}
              </Badge>
            </Inline>
          </Stack>
          <Button
            fontSize={1}
            icon={SyncIcon}
            mode="ghost"
            onClick={refetch}
            text="Refetch"
            title="Run the query again"
          />
        </Flex>
      </Card>

      {versionsLoading ? (
        <Flex justify="center" padding={5}>
          <Spinner muted />
        </Flex>
      ) : versions.length === 0 ? (
        <Card border padding={4} radius={3} tone="caution">
          <Text size={1}>
            No documents found for group <code>{groupId}</code>.
          </Text>
        </Card>
      ) : (
        <VersionsGrid
          columns={columns}
          rows={rows}
          cellIndex={cellIndex}
          highlightedId={highlightedStub?._id}
          selectedBundle={selectedBundle}
          selectedVariantId={selectedVariantName}
          onSelectCell={handleSelectCell}
          onSelectColumn={handleSelectColumn}
          onSelectRow={handleSelectRow}
        />
      )}

      <ResultPanel
        requestUrl={requestUrl}
        loading={queryLoading}
        error={queryError}
        resolvedDocument={resolvedDocument}
        highlightedStub={highlightedStub}
        columns={columns}
        rows={rows}
      />
    </Stack>
  )
}

function VersionsGrid(props: {
  columns: GridColumn[]
  rows: GridRow[]
  cellIndex: Map<string, VersionInfoDocumentStub[]>
  highlightedId: string | undefined
  selectedBundle: string
  selectedVariantId: string | undefined
  onSelectCell: (options: {
    bundleId: string
    variantDocumentId: SystemVariant['_id'] | undefined
  }) => void
  onSelectColumn: (variantId: string | undefined) => void
  onSelectRow: (bundleId: string) => void
}) {
  const {
    columns,
    rows,
    cellIndex,
    highlightedId,
    selectedBundle,
    selectedVariantId,
    onSelectCell,
    onSelectColumn,
    onSelectRow,
  } = props

  return (
    <Box style={{overflowX: 'auto'}}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${ROW_HEADER_WIDTH}px repeat(${columns.length}, minmax(${COLUMN_MIN_WIDTH}px, 1fr))`,
          gap: 8,
          alignItems: 'stretch',
          minWidth: ROW_HEADER_WIDTH + columns.length * COLUMN_MIN_WIDTH,
        }}
      >
        <div />
        {columns.map((column) => (
          <ColumnHeader
            key={column.variantId ?? '__default__'}
            column={column}
            selected={column.variantId === selectedVariantId}
            onSelect={() => onSelectColumn(column.variantId)}
          />
        ))}

        {rows.map((row) => (
          <RowCells
            key={row.bundleId}
            row={row}
            columns={columns}
            cellIndex={cellIndex}
            highlightedId={highlightedId}
            selected={row.bundleId === selectedBundle}
            onSelectCell={onSelectCell}
            onSelectRow={onSelectRow}
          />
        ))}
      </div>
    </Box>
  )
}

function ColumnHeader(props: {column: GridColumn; selected: boolean; onSelect: () => void}) {
  const {column, selected, onSelect} = props

  return (
    <Card
      border
      padding={3}
      radius={2}
      tone={selected ? 'primary' : 'default'}
      data-testid={`column-${column.variantId ?? 'default'}`}
      onClick={onSelect}
      style={{cursor: 'pointer'}}
      title={
        column.variantId
          ? `Set navbar variant to ${column.title}`
          : 'Set navbar variant to default (no variant)'
      }
    >
      <Stack space={2}>
        <Inline space={2}>
          <Text size={1} weight="semibold">
            {column.title}
          </Text>
          {selected && <Badge tone="primary">selected</Badge>}
          {column.missingDefinition && <Badge tone="caution">definition missing</Badge>}
        </Inline>
        <Code size={0}>{column.variantId ? `variant: ${column.variantId}` : 'base document'}</Code>
      </Stack>
    </Card>
  )
}

function RowHeader(props: {row: GridRow; selected: boolean; onSelect: () => void}) {
  const {row, selected, onSelect} = props

  return (
    <Card
      border
      padding={3}
      radius={2}
      tone={selected ? 'primary' : 'default'}
      data-testid={`row-${row.bundleId}`}
      onClick={onSelect}
      style={{cursor: 'pointer'}}
      title={`Set navbar perspective to ${row.title}`}
    >
      <Stack space={2}>
        <Inline space={2}>
          <Text size={1} weight="semibold">
            {row.title}
          </Text>
          {selected && <Badge tone="primary">selected</Badge>}
        </Inline>
        <Inline space={2}>
          {row.kind === 'release' && (
            <Badge mode="outline">{row.release?.metadata.releaseType}</Badge>
          )}
          {row.kind === 'unknown' && <Badge tone="caution">unknown bundle</Badge>}
          {row.stackIndex !== undefined && (
            <Badge
              tone="positive"
              mode="outline"
              title="Position in the perspective stack sent to the API (1 wins)"
            >
              stack #{row.stackIndex}
            </Badge>
          )}
        </Inline>
        {row.kind === 'release' && <Code size={0}>{row.bundleId}</Code>}
      </Stack>
    </Card>
  )
}

function RowCells(props: {
  row: GridRow
  columns: GridColumn[]
  cellIndex: Map<string, VersionInfoDocumentStub[]>
  highlightedId: string | undefined
  selected: boolean
  onSelectCell: (options: {
    bundleId: string
    variantDocumentId: SystemVariant['_id'] | undefined
  }) => void
  onSelectRow: (bundleId: string) => void
}) {
  const {row, columns, cellIndex, highlightedId, selected, onSelectCell, onSelectRow} = props

  return (
    <>
      <RowHeader row={row} selected={selected} onSelect={() => onSelectRow(row.bundleId)} />

      {columns.map((column) => (
        <GridCell
          key={`${row.bundleId}-${column.variantId ?? '__default__'}`}
          bundleId={row.bundleId}
          documents={getCellDocuments(cellIndex, row.bundleId, column.variantId)}
          highlightedId={highlightedId}
          onSelectCell={onSelectCell}
        />
      ))}
    </>
  )
}

function GridCell(props: {
  bundleId: string
  documents: VersionInfoDocumentStub[]
  highlightedId: string | undefined
  onSelectCell: (options: {
    bundleId: string
    variantDocumentId: SystemVariant['_id'] | undefined
  }) => void
}) {
  const {bundleId, documents, highlightedId, onSelectCell} = props

  if (documents.length === 0) {
    return (
      <Card border padding={3} radius={2} tone="transparent">
        <Flex align="center" height="fill" justify="center">
          <Text muted size={1}>
            —
          </Text>
        </Flex>
      </Card>
    )
  }

  return (
    <Stack space={2}>
      {documents.map((stub) => (
        <AnimatedGridCellDocument
          key={stub._id}
          stub={stub}
          isHighlighted={stub._id === highlightedId}
          onSelect={() =>
            onSelectCell({
              bundleId,
              variantDocumentId: getVariantDocumentId(stub._system?.variant?._ref),
            })
          }
        />
      ))}
    </Stack>
  )
}

function ResultPanel(props: {
  requestUrl: string
  loading: boolean
  error: string | undefined
  resolvedDocument: ResolvedDocument | null | undefined
  highlightedStub: VersionInfoDocumentStub | undefined
  columns: GridColumn[]
  rows: GridRow[]
}) {
  const {requestUrl, loading, error, resolvedDocument, highlightedStub, columns, rows} = props
  const [showRawResponse, setShowRawResponse] = useState(false)

  return (
    <Card border padding={4} radius={3}>
      <Stack space={4}>
        <Stack space={3}>
          <Text muted size={1} weight="medium">
            Request (resolved by Content Lake, not the studio)
          </Text>
          <Card padding={3} radius={2} tone="transparent" border>
            <Code size={0} style={{wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}>
              {requestUrl}
            </Code>
          </Card>
        </Stack>

        <Stack space={3}>
          <Text muted size={1} weight="medium">
            Result
          </Text>
          {loading ? (
            <Flex align="center" gap={3}>
              <Spinner muted />
              <Text muted size={1}>
                Querying…
              </Text>
            </Flex>
          ) : error ? (
            <Card padding={3} radius={2} tone="critical">
              <Text size={1}>{error}</Text>
            </Card>
          ) : resolvedDocument ? (
            <ResultSummary
              resolvedDocument={resolvedDocument}
              highlightedStub={highlightedStub}
              columns={columns}
              rows={rows}
            />
          ) : (
            <Card padding={3} radius={2} tone="caution">
              <Text size={1}>
                No document returned — the group has no content visible in this perspective.
              </Text>
            </Card>
          )}
        </Stack>

        {resolvedDocument && (
          <Stack space={3}>
            <Box>
              <Button
                fontSize={1}
                mode="ghost"
                onClick={() => setShowRawResponse((current) => !current)}
                text={showRawResponse ? 'Hide raw document' : 'Show raw document'}
              />
            </Box>
            {showRawResponse && (
              <Card border overflow="auto" padding={3} radius={2} style={{maxHeight: 360}}>
                <Code language="json" size={0}>
                  {JSON.stringify(resolvedDocument, null, 2)}
                </Code>
              </Card>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

function ResultSummary(props: {
  resolvedDocument: ResolvedDocument
  highlightedStub: VersionInfoDocumentStub | undefined
  columns: GridColumn[]
  rows: GridRow[]
}) {
  const {resolvedDocument, highlightedStub, columns, rows} = props

  // Human description of the grid cell the returned document lives in.
  const matchedCell = useMemo(() => {
    if (!highlightedStub) return undefined
    const bundleId = getStubBundleId(highlightedStub)
    const variantId = getStubVariantId(highlightedStub)
    const row = rows.find((candidate) => candidate.bundleId === bundleId)
    const column = columns.find((candidate) => candidate.variantId === variantId)
    return `${row?.title ?? bundleId} × ${column?.title ?? variantId ?? 'Default'}`
  }, [columns, highlightedStub, rows])

  return (
    <Stack space={3}>
      <Inline space={2}>
        <Badge tone={highlightedStub ? 'positive' : 'caution'}>
          {highlightedStub ? `cell: ${matchedCell}` : 'not matched on grid'}
        </Badge>
        <Badge mode="outline">{resolvedDocument._type}</Badge>
      </Inline>
      <ResultField label="_id" value={resolvedDocument._id} />
      {resolvedDocument._originalId && (
        <ResultField label="_originalId" value={resolvedDocument._originalId} />
      )}
      <ResultField label="_rev" value={resolvedDocument._rev} />
      <ResultField label="_updatedAt" value={resolvedDocument._updatedAt} />
      {highlightedStub && <ResultField label="grid document" value={highlightedStub._id} />}
    </Stack>
  )
}

function ResultField({label, value}: {label: string; value: string}) {
  return (
    <Flex align="center" gap={2}>
      <Box style={{width: 110, flexShrink: 0}}>
        <Text muted size={0}>
          {label}
        </Text>
      </Box>
      <Code size={0} style={{wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}>
        {value}
      </Code>
    </Flex>
  )
}
