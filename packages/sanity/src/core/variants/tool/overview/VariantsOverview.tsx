import {AddIcon} from '@sanity/icons/Add'
import {SearchIcon} from '@sanity/icons/Search'
import {Box, Card, Container, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n'
import {Table, type TableProps} from '../../../releases/tool/components/Table/Table'
import {CreateVariantDialog} from '../../components/dialog/CreateVariantDialog'
import {CreateVariantSetDialog} from '../../components/dialog/CreateVariantSetDialog'
import {VariantSetExplainer} from '../../components/VariantSetExplainer'
import {useVariantsDocumentCounts} from '../../hooks/useVariantsDocumentCounts'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {type SystemVariant} from '../../types'
import {getVariantSetReference, type VariantSetReference} from '../../util/variantSet'
import {filterVariantsForSearch, getVariantId} from '../util'
import {VariantMenuButton} from './VariantMenuButton'
import {VariantsEmptyState} from './VariantsEmptyState'
import {type TableVariant, variantsOverviewColumnDefs} from './VariantsOverviewColumnDefs'

const VARIANT_TABLE_ROW_ID = '_id'

export function VariantsOverview() {
  const {t} = useTranslation(variantsLocaleNamespace)
  const router = useRouter()
  const {data: variants, error, loading} = useAllVariants()
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateVariantDialogOpen, setIsCreateVariantDialogOpen] = useState(false)
  const [isCreateVariantSetDialogOpen, setIsCreateVariantSetDialogOpen] = useState(false)
  const [expandedSets, setExpandedSets] = useState<ReadonlySet<string>>(() => new Set())

  const toggleSet = useCallback((setId: string) => {
    setExpandedSets((previous) => {
      const next = new Set(previous)
      if (next.has(setId)) {
        next.delete(setId)
      } else {
        next.add(setId)
      }
      return next
    })
  }, [])

  const handleCreateVariant = useCallback(() => {
    setIsCreateVariantDialogOpen(true)
  }, [])

  const handleCreateVariantSet = useCallback(() => {
    setIsCreateVariantSetDialogOpen(true)
  }, [])

  const handleOnCreateVariant = useCallback(
    (createdVariantId: string) => {
      setIsCreateVariantDialogOpen(false)
      router.navigate({variantId: getVariantId(createdVariantId)})
    },
    [router],
  )

  const columnDefs = useMemo(() => variantsOverviewColumnDefs(t), [t])
  const renderRowActions = useCallback<
    NonNullable<TableProps<TableVariant, undefined>['rowActions']>
  >(({datum}) => {
    // Set aggregate (group header) rows have no per-definition actions.
    if ((datum as TableVariant).isSetAggregate) {
      return null
    }
    return (
      <VariantMenuButton
        documentCount={(datum as TableVariant).documentCount}
        variant={datum as SystemVariant}
      />
    )
  }, [])

  const variantsList = useMemo(() => variants ?? [], [variants])

  const {data: documentCounts, error: documentCountsError} = useVariantsDocumentCounts()

  const filteredVariants = useMemo(
    () =>
      filterVariantsForSearch(variantsList, searchQuery).map(
        (variant): TableVariant => ({
          ...variant,
          documentCount: documentCounts?.[variant._id] ?? (documentCountsError ? null : undefined),
        }),
      ),
    [variantsList, searchQuery, documentCounts, documentCountsError],
  )

  // Collapse each set's generated members under one aggregate header row so a large set doesn't
  // flood the table. Skipped while searching (grouping would hide matches) and for singleton sets.
  const displayRows = useMemo<TableVariant[]>(() => {
    if (searchQuery.trim()) {
      return filteredVariants
    }

    const membersBySet = new Map<string, {ref: VariantSetReference; children: TableVariant[]}>()
    const standalone: TableVariant[] = []

    for (const variant of filteredVariants) {
      const ref = getVariantSetReference(variant)
      if (ref) {
        const group = membersBySet.get(ref.id) ?? {ref, children: []}
        group.children.push(variant)
        membersBySet.set(ref.id, group)
      } else {
        standalone.push(variant)
      }
    }

    const rows: TableVariant[] = []
    for (const [setId, {ref, children}] of membersBySet) {
      if (children.length < 2) {
        rows.push(...children)
        continue
      }

      const documentTotal = children.reduce(
        (sum, child) => sum + (typeof child.documentCount === 'number' ? child.documentCount : 0),
        0,
      )
      const isSetExpanded = expandedSets.has(setId)

      rows.push({
        // Synthetic id that satisfies the variant id template while staying distinct from any real
        // variant document id; only used as the table row key (never navigated to).
        _id: `_.variants.set-${setId}`,
        _type: 'system.variant',
        _rev: '',
        _createdAt: '',
        _updatedAt: '',
        conditions: {},
        priority: 0,
        metadata: {title: ref.name},
        documentCount: documentTotal,
        isSetAggregate: true,
        setReference: ref,
        setChildCount: children.length,
        isSetExpanded,
        onToggleSet: () => toggleSet(setId),
      })

      if (isSetExpanded) {
        for (const child of children) {
          rows.push({...child, isSetChild: true})
        }
      }
    }

    rows.push(...standalone)
    return rows
  }, [filteredVariants, searchQuery, expandedSets, toggleSet])

  const hasVariants = variantsList.length > 0

  const createButtons = useMemo(
    () => (
      <Flex gap={2}>
        <Button
          disabled={isCreateVariantDialogOpen}
          icon={AddIcon}
          onClick={handleCreateVariant}
          text={t('overview.action.create-variant')}
        />
        <Button
          disabled={isCreateVariantSetDialogOpen}
          icon={AddIcon}
          mode="ghost"
          onClick={handleCreateVariantSet}
          text={t('overview.action.create-variant-set')}
        />
      </Flex>
    ),
    [
      handleCreateVariant,
      handleCreateVariantSet,
      isCreateVariantDialogOpen,
      isCreateVariantSetDialogOpen,
      t,
    ],
  )

  const tableEmptyState = useCallback(() => {
    if (error && !hasVariants) {
      return (
        <Flex align="center" direction="column" gap={3} justify="center" padding={4}>
          <Text muted size={1}>
            {t('overview.error')}
          </Text>
        </Flex>
      )
    }

    return <VariantsEmptyState createVariantButton={createButtons} />
  }, [createButtons, error, hasVariants, t])

  return (
    <Flex direction="column" flex={1} height="fill">
      {/* Same container width as releases document table (`container[3]` in Table), so chrome aligns with row content */}
      <Container flex="none" width={3}>
        <Flex direction="column" paddingX={3}>
          <Card flex="none" paddingY={5}>
            <Flex align="flex-start" gap={4} justify="space-between">
              <Stack space={3}>
                <Text as="h1" size={4} weight="bold">
                  {t('overview.title')}
                </Text>
                <Text muted size={1}>
                  {t('overview.description')}
                </Text>
              </Stack>
              {createButtons}
            </Flex>
          </Card>

          <Box flex="none" paddingBottom={4} paddingTop={2}>
            <TextInput
              clearButton={!!searchQuery}
              fontSize={1}
              icon={SearchIcon}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
              onClear={() => setSearchQuery('')}
              placeholder={t('overview.search.placeholder')}
              radius={3}
              value={searchQuery}
            />
          </Box>

          {hasVariants && (
            <Box flex="none" paddingBottom={4}>
              <VariantSetExplainer />
            </Box>
          )}

          {error && (
            <Card flex="none" padding={3} tone="critical">
              <Text size={1}>{t('overview.error')}</Text>
            </Card>
          )}
        </Flex>
      </Container>

      {/* Full-width scroll region so table borders span the tool pane (same pattern as release detail summary). */}
      <Box flex={1} overflow="auto" ref={setScrollContainerRef}>
        <Table<TableVariant>
          columnDefs={columnDefs}
          data={displayRows}
          emptyState={tableEmptyState}
          loading={loading}
          rowId={VARIANT_TABLE_ROW_ID}
          rowActions={renderRowActions}
          scrollContainerRef={scrollContainerRef}
        />
      </Box>

      {isCreateVariantDialogOpen && (
        <CreateVariantDialog
          onCancel={() => setIsCreateVariantDialogOpen(false)}
          onSubmit={handleOnCreateVariant}
        />
      )}

      {isCreateVariantSetDialogOpen && (
        <CreateVariantSetDialog
          onCancel={() => setIsCreateVariantSetDialogOpen(false)}
          // The generated definitions surface in this table automatically via the live
          // useAllVariants query, so closing the dialog is all that's needed on done.
          onDone={() => setIsCreateVariantSetDialogOpen(false)}
        />
      )}
    </Flex>
  )
}
