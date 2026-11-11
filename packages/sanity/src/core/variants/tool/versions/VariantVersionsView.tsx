import {type ReleaseDocument} from '@sanity/client'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
// eslint-disable-next-line @sanity/i18n/no-i18next-import -- types-only import
import {type TFunction} from 'i18next'
import {memo, useEffect, useMemo, useState} from 'react'
import {IntentLink} from 'sanity/router'
import {Text, Container, Flex, Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {RelativeTime} from '../../../components/RelativeTime'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {DocumentTable} from '../../../releases/tool/components/Table/DocumentTable'
import {Headers} from '../../../releases/tool/components/Table/TableHeader'
import {type Column, type VisibleColumn} from '../../../releases/tool/components/Table/types'
import {getSearchableTypes} from '../../../search/common/getSearchableTypes'
import {useDocumentPreviewValues} from '../../../tasks/hooks/useDocumentPreviewValues'
import {useDocumentLensFeed} from '../../hooks/useDocumentLensFeed'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {type SystemVariant, type VariantId} from '../../types'
import {getVariantType} from '../../util/variantType'
import {getVariantId, getVariantTitle} from '../util'
import {
  DEFAULT_DEFINITION,
  createVisibleRowTracker,
  type DocumentLensRow,
  getRowPreviewVariant,
  getVersionLinkTarget,
  type VersionFilters,
  type VersionSort,
} from './versionRows'

type VersionRow = DocumentLensRow & {order: number; rowKey: string}

type VisibleRowTracker = ReturnType<typeof createVisibleRowTracker>

/** Reports while its row is mounted, which the virtualized table only does for rows on screen. */
function VisibleRow({groupId, tracker}: {groupId: string; tracker: VisibleRowTracker}) {
  useEffect(() => tracker.track(groupId), [groupId, tracker])
  return null
}

interface Option<Value extends string> {
  value: Value | undefined
  text: string
}

/** A single-select menu: the button shows the chosen option. */
function OptionMenu<Value extends string>({
  id,
  options,
  value,
  onChange,
}: {
  id: string
  options: Option<Value>[]
  value: Value | undefined
  onChange: (value: Value | undefined) => void
}) {
  const selected = options.find((option) => option.value === value) ?? options[0]
  return (
    <MenuButton
      id={id}
      button={
        <Button data-testid={id} iconRight={ChevronDownIcon} mode="ghost" text={selected?.text} />
      }
      menu={
        <Menu>
          {options.map((option) => (
            <MenuItem
              key={option.value ?? '__all'}
              iconRight={option.value === value ? CheckmarkIcon : undefined}
              onClick={() => onChange(option.value)}
              pressed={option.value === value}
              text={option.text}
            />
          ))}
        </Menu>
      }
      popover={{placement: 'bottom-start', portal: true}}
    />
  )
}

const VersionPreview = memo(function VersionPreview({
  row,
  variantType,
}: {
  row: VersionRow
  variantType: string | undefined
}) {
  const {params, searchParams, perspectiveStack} = getVersionLinkTarget(row, variantType)
  const {isLoading, value} = useDocumentPreviewValues({
    documentId: row.groupId,
    documentType: row._type,
    perspectiveStack,
    variant: getRowPreviewVariant(row),
  })

  return (
    // Opens the document on this version, with the version inventory open.
    <Card
      as={IntentLink}
      data-as="a"
      data-testid="version-row-link"
      flex={1}
      intent="edit"
      params={params}
      radius={2}
      searchParams={searchParams}
      style={{minWidth: 0}}
      tone="inherit"
    >
      <SanityDefaultPreview {...(value || {})} isPlaceholder={isLoading} />
    </Card>
  )
})

function TypeTitle({type}: {type: string}) {
  const schemaType = useSchema().get(type)
  return (
    <Text size={1} as="div" trim={true}>
      {schemaType?.title || type}
    </Text>
  )
}

function textHeader(text: string): VisibleColumn<VersionRow>['header'] {
  return (props) => (
    <Flex {...props.headerProps} alignItems="center" paddingX={2} paddingY={3}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {text}
      </Text>
    </Flex>
  )
}

function getVersionLabel(
  row: DocumentLensRow,
  releases: Map<string, ReleaseDocument>,
  t: TFunction<'variants'>,
): string {
  if (row.kind === 'published') return t('versions.state.published')
  if (row.kind === 'draft') return t('versions.state.draft')
  return releases.get(row.bundle)?.metadata?.title || t('versions.state.release')
}

function getColumnDefs({
  t,
  variantsById,
  releases,
  tracker,
}: {
  t: TFunction<'variants'>
  variantsById: Map<string, SystemVariant>
  releases: Map<string, ReleaseDocument>
  tracker: VisibleRowTracker
}): Column<VersionRow>[] {
  return [
    // Rows arrive in the feed's document order; this hidden column keeps it.
    {id: 'order', hidden: true, width: null, sortTransform: (row) => row.order},
    {
      id: 'document',
      width: null,
      style: {minWidth: 240},
      header: (props) => (
        <Flex {...props.headerProps} flexBasis="0%" flexGrow={1} paddingX={2} paddingY={3}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            {t('detail.documents.table.document')}
          </Text>
        </Flex>
      ),
      cell: ({cellProps, datum}) => (
        <Flex {...cellProps} alignItems="center" flexBasis="0%" flexGrow={1} padding={1}>
          <Box flexBasis="0%" flexGrow={1} style={{minWidth: 0}}>
            {!datum.isLoading && <VisibleRow groupId={datum.groupId} tracker={tracker} />}
            {datum.isLoading || datum.placeholder ? (
              // A document whose page has not loaded yet.
              <SanityDefaultPreview isPlaceholder />
            ) : (
              <VersionPreview
                row={datum}
                variantType={
                  datum.variantId ? getVariantType(variantsById.get(datum.variantId)) : undefined
                }
              />
            )}
          </Box>
        </Flex>
      ),
    },
    {
      id: '_type',
      width: 130,
      header: textHeader(t('detail.documents.table.type')),
      cell: ({cellProps, datum}) => (
        <Flex {...cellProps} alignItems="center" paddingX={2}>
          {!datum.isLoading && !datum.placeholder && <TypeTitle type={datum._type} />}
        </Flex>
      ),
    },
    {
      id: 'variantId',
      width: 160,
      header: textHeader(t('versions.table.definition')),
      cell: ({cellProps, datum}) => (
        <Flex {...cellProps} alignItems="center" paddingX={2}>
          {!datum.isLoading && !datum.placeholder && (
            <Text size={1} as="div" trim={true} muted={!datum.variantId}>
              {datum.variantId
                ? variantsById.has(datum.variantId)
                  ? getVariantTitle(variantsById.get(datum.variantId)!)
                  : getVariantId(datum.variantId)
                : t('versions.definition.default')}
            </Text>
          )}
        </Flex>
      ),
    },
    {
      id: 'bundle',
      width: 160,
      header: textHeader(t('versions.table.version')),
      cell: ({cellProps, datum}) => (
        <Flex {...cellProps} alignItems="center" paddingX={2}>
          {!datum.isLoading && !datum.placeholder && (
            <Text size={1} as="div" trim={true}>
              {getVersionLabel(datum, releases, t)}
            </Text>
          )}
        </Flex>
      ),
    },
    {
      id: '_updatedAt',
      width: 130,
      header: textHeader(t('detail.documents.table.last-edited')),
      cell: ({cellProps, datum}) => (
        <Flex {...cellProps} alignItems="center" paddingX={2} paddingY={3}>
          {!datum.isLoading && !datum.placeholder && (
            <Text muted size={1} as="div" trim={true}>
              <RelativeTime time={datum._updatedAt} useTemporalPhrase minimal />
            </Text>
          )}
        </Flex>
      ),
    },
  ]
}

function searchVersion(row: VersionRow, term: string): boolean {
  const needle = term.toLowerCase()
  return row.groupId.toLowerCase().includes(needle) || row._type.toLowerCase().includes(needle)
}

/**
 * The Document lens of the Variants tool: every stored version across documents, one row per
 * version, so an editor can see what versions exist and in what state.
 *
 * @internal
 */
export function VariantVersionsView(): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const schema = useSchema()
  const {data: variants, byId: variantsById} = useAllVariants()
  const {byId: releases} = useActiveReleases()

  const [type, setType] = useState<string | undefined>(undefined)
  const [filters, setFilters] = useState<VersionFilters>({})
  const [sort, setSort] = useState<VersionSort>('last-edited')

  const feed = useDocumentLensFeed({type, filters, sort})
  const rows = useMemo<VersionRow[]>(
    () => feed.rows.map((row, order) => ({...row, order, rowKey: row._id})),
    [feed.rows],
  )

  // The feed loads the pages around the documents on screen. Rows report while mounted; the
  // range is recomputed when they change and when the document list changes.
  const [visibleGroupIds, setVisibleGroupIds] = useState<string[]>([])
  const [tracker] = useState(() => createVisibleRowTracker(setVisibleGroupIds))
  useEffect(() => tracker.start(), [tracker])
  const {onVisibleGroupIds} = feed
  useEffect(() => onVisibleGroupIds(visibleGroupIds), [onVisibleGroupIds, visibleGroupIds])

  const columnDefs = useMemo(
    () => getColumnDefs({t, variantsById, releases, tracker}),
    [releases, t, tracker, variantsById],
  )

  const typeOptions = useMemo<Option<string>[]>(
    () => [
      {value: undefined, text: t('versions.filter.type.all')},
      ...getSearchableTypes(schema)
        .map((schemaType) => ({value: schemaType.name, text: schemaType.title ?? schemaType.name}))
        .toSorted((left, right) => left.text.localeCompare(right.text)),
    ],
    [schema, t],
  )
  const definitionOptions = useMemo<Option<VariantId | typeof DEFAULT_DEFINITION>[]>(
    () => [
      {value: undefined, text: t('versions.filter.definition.all')},
      {value: DEFAULT_DEFINITION, text: t('versions.definition.default')},
      ...(variants ?? []).map((variant) => ({value: variant._id, text: getVariantTitle(variant)})),
    ],
    [t, variants],
  )
  const releaseOptions = useMemo<Option<string>[]>(
    () => [
      {value: undefined, text: t('versions.filter.release.all')},
      ...[...releases.values()].map((release) => ({
        value: release._id,
        text: release.metadata?.title || release.name,
      })),
    ],
    [releases, t],
  )
  const stateOptions = useMemo<Option<NonNullable<VersionFilters['state']>>[]>(
    () => [
      {value: undefined, text: t('versions.filter.state.all')},
      {value: 'published', text: t('versions.state.published')},
      {value: 'draft', text: t('versions.state.draft')},
      {value: 'release', text: t('versions.state.release')},
    ],
    [t],
  )

  return (
    <Flex flexDirection="column" flexBasis="0%" flexGrow={1} height="100%">
      {sort === 'last-edited' && (
        // The feed pages by document, so documents keep the feed's order whatever the sort.
        <Container flexBasis="auto" flexGrow={0} flexShrink={0} size={3}>
          <Box paddingX={3} paddingBottom={2}>
            <Text data-testid="versions-sort-hint" muted size={1} as="div" trim={true}>
              {t('versions.sort.last-edited.hint')}
            </Text>
          </Box>
        </Container>
      )}
      <DocumentTable<VersionRow>
        alwaysShowCommandLane
        columnDefs={columnDefs}
        commandLaneActions={
          <Flex gap={2}>
            <OptionMenu<VersionSort>
              id="versions-sort"
              onChange={(value) => setSort(value ?? 'last-edited')}
              options={[
                {value: 'last-edited', text: t('versions.sort.last-edited')},
                {value: 'version-order', text: t('versions.sort.version-order')},
              ]}
              value={sort}
            />
          </Flex>
        }
        defaultSort={{column: 'order', direction: 'asc'}}
        emptyState={feed.error ? t('versions.error') : t('versions.no-versions')}
        filterTabs={
          <Flex gap={2}>
            <OptionMenu
              id="versions-filter-type"
              onChange={setType}
              options={typeOptions}
              value={type}
            />
            <OptionMenu
              id="versions-filter-definition"
              onChange={(definition) => setFilters((previous) => ({...previous, definition}))}
              options={definitionOptions}
              value={filters.definition}
            />
            <OptionMenu
              id="versions-filter-release"
              onChange={(release) => setFilters((previous) => ({...previous, release}))}
              options={releaseOptions}
              value={filters.release}
            />
            <OptionMenu
              id="versions-filter-state"
              onChange={(state) => setFilters((previous) => ({...previous, state}))}
              options={stateOptions}
              value={filters.state}
            />
          </Flex>
        }
        filterTabsScroll={false}
        getRowKey={(row) => row._id}
        id="variant-versions-table"
        loading={feed.loading}
        rows={rows}
        // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
        rowId="rowKey"
        searchPlaceholder={t('versions.search.placeholder')}
        searchPredicate={searchVersion}
      />
    </Flex>
  )
}
