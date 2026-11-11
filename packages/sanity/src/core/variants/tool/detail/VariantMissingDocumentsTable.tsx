import {type ReleaseDocument} from '@sanity/client'
import {AddIcon} from '@sanity/icons/Add'
import {Card} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
// eslint-disable-next-line @sanity/i18n/no-i18next-import -- types-only import
import {type TFunction} from 'i18next'
import {memo, useCallback, useMemo, useState} from 'react'
import {IntentLink} from 'sanity/router'
import {Text, Flex, Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {getNearestBaseVersion} from '../../../documentGroupInventory/components/CreateVariant/getNearestBaseVersion'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {usePerspective} from '../../../perspective/usePerspective'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {DocumentTable} from '../../../releases/tool/components/Table/DocumentTable'
import {Headers} from '../../../releases/tool/components/Table/TableHeader'
import {type Column} from '../../../releases/tool/components/Table/types'
import {useDocumentPreviewValues} from '../../../tasks/hooks/useDocumentPreviewValues'
import {getPublishedId} from '../../../util/draftUtils'
import {type MissingDocumentRow} from '../../hooks/useVariantDefinitionLens'
import {useVariantDocumentOperations} from '../../hooks/useVariantDocumentOperations'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {
  getMissingVersionDestination,
  type MissingVersionDestination,
} from './missingVersionDestination'
import {VariantDocumentTypePicker} from './VariantDocumentTypePicker'

const PREVIEW_PERSPECTIVE_STACK = ['drafts']

// The rows carry version stubs, not preview values, so search matches the id and the type.
function searchMissingDocument(row: MissingDocumentRow, searchTerm: string): boolean {
  const term = searchTerm.toLowerCase()
  return row.groupId.toLowerCase().includes(term) || row._type.toLowerCase().includes(term)
}

const MissingDocumentPreview = memo(function MissingDocumentPreview({
  row,
}: {
  row: MissingDocumentRow
}) {
  const publishedId = getPublishedId(row.groupId)
  const {isLoading, value} = useDocumentPreviewValues({
    documentId: publishedId,
    documentType: row._type,
    perspectiveStack: PREVIEW_PERSPECTIVE_STACK,
  })

  return (
    <Card
      as={IntentLink}
      data-as="a"
      flex={1}
      intent="edit"
      params={{id: publishedId, type: row._type}}
      radius={2}
      style={{minWidth: 0}}
      tone="inherit"
    >
      <SanityDefaultPreview {...(value || {})} isPlaceholder={isLoading} />
    </Card>
  )
})

function MissingDocumentType({type}: {type: string}) {
  const schemaType = useSchema().get(type)
  return (
    <Text size={1} as="div" trim={true}>
      {schemaType?.title || type}
    </Text>
  )
}

function getColumnDefs(t: TFunction<'variants'>): Column<MissingDocumentRow>[] {
  return [
    {
      id: '_type',
      width: 140,
      sorting: true,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3}>
          <Headers.SortHeaderButton
            paddingLeft={2}
            text={t('detail.documents.table.type')}
            {...props}
          />
        </Flex>
      ),
      cell: ({cellProps, datum}) => (
        <Flex alignItems="center" {...cellProps}>
          <Box paddingX={2}>{!datum.isLoading && <MissingDocumentType type={datum._type} />}</Box>
        </Flex>
      ),
    },
    {
      id: 'search',
      width: null,
      style: {minWidth: 240},
      sorting: true,
      sortTransform: (row) => row.groupId,
      header: (props) => (
        <Flex {...props.headerProps} flexBasis="0%" flexGrow={1} paddingY={3}>
          <Headers.SortHeaderButton
            paddingLeft={2}
            text={t('detail.documents.table.document')}
            {...props}
          />
        </Flex>
      ),
      cell: ({cellProps, datum}) => (
        <Flex {...cellProps} alignItems="center" flexBasis="0%" flexGrow={1} padding={1}>
          <Box flexBasis="0%" flexGrow={1} style={{minWidth: 0}}>
            {datum.isLoading ? (
              <SanityDefaultPreview isPlaceholder />
            ) : (
              <MissingDocumentPreview row={datum} />
            )}
          </Box>
        </Flex>
      ),
    },
  ]
}

/**
 * Creates the missing version of one document for a definition, with the same create action the
 * document's version inventory uses, in the destination {@link getMissingVersionDestination}
 * picks from the selected perspective. The new variant starts from the document's version in the
 * destination release if it has one, else its draft, else its published version.
 *
 * A row stays pending after a successful create until it leaves `rows`: the listener that moves it
 * to "Has a version" is throttled, and creating it a second time would fail.
 */
function useCreateMissingVersion({
  variant,
  rows,
  loading,
}: {
  variant: SystemVariant
  rows: MissingDocumentRow[]
  loading: boolean
}) {
  const {t} = useTranslation(variantsLocaleNamespace)
  const toast = useToast()
  const schema = useSchema()
  const {createVariantDocument} = useVariantDocumentOperations()
  const {selectedPerspective} = usePerspective()
  const getDestination = useCallback(
    (type: string) =>
      getMissingVersionDestination({
        selectedPerspective,
        liveEdit: Boolean(schema.get(type)?.liveEdit),
      }),
    [schema, selectedPerspective],
  )
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set())
  const [previousRows, setPreviousRows] = useState(rows)
  // While loading, `rows` is empty and says nothing about which documents are still missing.
  if (rows !== previousRows && !loading) {
    setPreviousRows(rows)
    const missing = new Set(rows.map((row) => row.groupId))
    if ([...pending].some((groupId) => !missing.has(groupId))) {
      setPending(new Set([...pending].filter((groupId) => missing.has(groupId))))
    }
  }

  const create = useCallback(
    async (row: MissingDocumentRow) => {
      setPending((previous) => new Set(previous).add(row.groupId))
      const destination = getDestination(row._type)
      const selectedPerspective = destination.perspective

      const done = () =>
        setPending((previous) => {
          const next = new Set(previous)
          next.delete(row.groupId)
          return next
        })

      try {
        const baseDocument =
          (destination.kind === 'release'
            ? getNearestBaseVersion({
                variantId: variant._id,
                bundle: {type: 'release', releaseId: destination.release._id},
                versions: row.versions,
              })
            : undefined) ??
          getNearestBaseVersion({
            variantId: variant._id,
            bundle: {type: 'drafts'},
            versions: row.versions,
          })
        await (baseDocument
          ? createVariantDocument({
              baseId: baseDocument._id,
              ifBaseRevisionId: baseDocument._rev,
              documentGroupId: getPublishedId(row.groupId),
              variant,
              selectedPerspective,
            })
          : createVariantDocument({
              // No version to start from (for example a document only in a release): start empty.
              document: {_type: row._type},
              documentGroupId: getPublishedId(row.groupId),
              variant,
              selectedPerspective,
            }))
        // Still pending: the row moves to "Has a version" when the listener sees the new version,
        // and leaves `pending` then.
      } catch (error) {
        done()
        toast.push({
          closable: true,
          status: 'error',
          title: t('detail.missing.create.error'),
          description: error instanceof Error ? error.message : String(error),
        })
      }
    },
    [createVariantDocument, getDestination, t, toast, variant],
  )

  return {create, getDestination, pending}
}

function getReleaseTitle(release: ReleaseDocument, t: TFunction<'variants'>): string {
  return release.metadata?.title || t('detail.missing.untitled-release')
}

function getDestinationTitle(
  destination: MissingVersionDestination,
  t: TFunction<'variants'>,
): string {
  if (destination.kind === 'release') return getReleaseTitle(destination.release, t)
  return t(
    destination.kind === 'published'
      ? 'detail.missing.destination.published'
      : 'detail.missing.destination.drafts',
  )
}

/**
 * The "Missing" half of a variant definition's detail page: documents of the chosen type that do
 * not have a version for the definition yet, each with an action to create one.
 *
 * @internal
 */
export function VariantMissingDocumentsTable({
  rows,
  loading,
  variant,
  selectedType,
  onSelectType,
  hasTypes,
}: {
  rows: MissingDocumentRow[]
  loading: boolean
  variant: SystemVariant
  selectedType: string | undefined
  onSelectType: (type: string | undefined) => void
  /** Whether any type is being compared. Without one, there is nothing to list yet. */
  hasTypes: boolean
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const {create, getDestination, pending} = useCreateMissingVersion({variant, rows, loading})
  const columnDefs = useMemo(() => getColumnDefs(t), [t])
  const tableRows = useMemo(() => rows.map((row) => ({...row, rowKey: row.groupId})), [rows])

  const renderRowActions = useCallback(
    ({datum}: {datum: unknown}) => {
      const row = datum as MissingDocumentRow & {isLoading?: boolean}
      if (row.isLoading) return null
      const destination = getDestination(row._type)
      const fallback = destination.kind === 'release' ? undefined : destination.fallback
      return (
        <Button
          data-testid="variant-missing-create-version"
          disabled={pending.has(row.groupId)}
          icon={AddIcon}
          mode="bleed"
          onClick={() => void create(row)}
          text={t('detail.missing.create-in', {destination: getDestinationTitle(destination, t)})}
          tooltipProps={
            fallback
              ? {
                  content: t(`detail.missing.fallback.${fallback.reason}`, {
                    release: getReleaseTitle(fallback.release, t),
                    destination: getDestinationTitle(destination, t),
                  }),
                }
              : undefined
          }
        />
      )
    },
    [create, getDestination, pending, t],
  )

  // TODO(GA, not open beta): create the missing versions for many documents at once. The
  // DocumentTable `selection` prop (select column plus a bulk action bar) is the place for it; each
  // selected row would run the same create as the row action, in the same destination, batched
  // into one transaction.

  return (
    <DocumentTable<MissingDocumentRow & {rowKey: string}>
      alwaysShowCommandLane
      columnDefs={columnDefs}
      commandLaneActions={
        <VariantDocumentTypePicker onSelect={onSelectType} selectedType={selectedType} />
      }
      defaultSort={{column: 'search', direction: 'asc'}}
      emptyState={hasTypes ? t('detail.missing.no-documents') : t('detail.missing.no-types')}
      getRowKey={(row) => row.groupId}
      id="variant-missing-documents-table"
      loading={loading}
      rowActions={renderRowActions}
      rows={tableRows}
      // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
      rowId="rowKey"
      searchPlaceholder={t('detail.documents.table.search-placeholder')}
      searchPredicate={searchMissingDocument}
      searchTestId="variant-missing-documents-search"
    />
  )
}
