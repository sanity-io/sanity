import {type ReleaseDocument} from '@sanity/client'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
// eslint-disable-next-line @sanity/i18n/no-i18next-import -- types-only import
import {type TFunction} from 'i18next'
import {memo, useMemo, useState} from 'react'
import {IntentLink} from 'sanity/router'
import {Text, Flex, Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {RelativeTime} from '../../../components/RelativeTime'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type VersionStub} from '../../../inventoryModel/types'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {DocumentTable} from '../../../releases/tool/components/Table/DocumentTable'
import {Headers} from '../../../releases/tool/components/Table/TableHeader'
import {type Column, type VisibleColumn} from '../../../releases/tool/components/Table/types'
import {getSearchableTypes} from '../../../search/common/getSearchableTypes'
import {useDocumentPreviewValues} from '../../../tasks/hooks/useDocumentPreviewValues'
import {useVersionInventory, VERSION_INVENTORY_LIMIT} from '../../hooks/useVersionInventory'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {type SystemVariant, type VariantId} from '../../types'
import {getVariantType} from '../../util/variantType'
import {getVariantId, getVariantTitle} from '../util'
import {
  DEFAULT_DEFINITION,
  filterVersions,
  getReleaseOptions,
  getRowPreviewVariant,
  getVersionLinkTarget,
  orderVersions,
  type VersionFilters,
  type VersionGrouping,
  type VersionSort,
} from './versionRows'

type VersionRow = VersionStub & {order: number; rowKey: string}

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
  row: VersionStub,
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
}: {
  t: TFunction<'variants'>
  variantsById: Map<string, SystemVariant>
  releases: Map<string, ReleaseDocument>
}): Column<VersionRow>[] {
  return [
    // Rows arrive already ordered by the sort and group controls; this hidden column keeps it.
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
            {datum.isLoading ? (
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
          {!datum.isLoading && <TypeTitle type={datum._type} />}
        </Flex>
      ),
    },
    {
      id: 'variantId',
      width: 160,
      header: textHeader(t('versions.table.definition')),
      cell: ({cellProps, datum}) => (
        <Flex {...cellProps} alignItems="center" paddingX={2}>
          {!datum.isLoading && (
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
          {!datum.isLoading && (
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
          {!datum.isLoading && (
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
  const [grouping, setGrouping] = useState<VersionGrouping>('none')

  // The type filter bounds the query; the other filters work on the rows that were read.
  const types = useMemo(() => (type ? [type] : []), [type])
  const inventory = useVersionInventory(types)

  const rows = useMemo<VersionRow[]>(
    () =>
      orderVersions(filterVersions(inventory.rows, filters), {sort, grouping}).map(
        (row, order) => ({...row, order, rowKey: row._id}),
      ),
    [filters, grouping, inventory.rows, sort],
  )

  const columnDefs = useMemo(
    () => getColumnDefs({t, variantsById, releases}),
    [releases, t, variantsById],
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
      ...getReleaseOptions(inventory.rows, releases).map((release) => ({
        value: release.id,
        text: release.title,
      })),
    ],
    [inventory.rows, releases, t],
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
      {inventory.truncated && (
        <Card flex="none" marginX={3} marginBottom={3} padding={3} radius={2} tone="caution">
          <Text size={1} as="div" trim={true} data-testid="versions-truncated">
            {t('versions.truncated', {limit: VERSION_INVENTORY_LIMIT})}
          </Text>
        </Card>
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
            <OptionMenu<VersionGrouping>
              id="versions-group"
              onChange={(value) => setGrouping(value ?? 'none')}
              options={[
                {value: 'none', text: t('versions.group.none')},
                {value: 'document', text: t('versions.group.document')},
                {value: 'definition', text: t('versions.group.definition')},
              ]}
              value={grouping}
            />
          </Flex>
        }
        defaultSort={{column: 'order', direction: 'asc'}}
        emptyState={inventory.error ? t('versions.error') : t('versions.no-versions')}
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
        loading={inventory.loading}
        rows={rows}
        // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
        rowId="rowKey"
        searchPlaceholder={t('versions.search.placeholder')}
        searchPredicate={searchVersion}
      />
    </Flex>
  )
}
