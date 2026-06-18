import {AddIcon, SearchIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n'
import {Table, type TableProps} from '../../../releases/tool/components/Table/Table'
import {CreateVariantDialog} from '../../components/dialog/CreateVariantDialog'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {type SystemVariant} from '../../types'
import {filterVariantsForSearch, getVariantId} from '../util'
import {type VariantOverviewRow} from './types'
import {useVariantDocumentGroupCounts} from './useVariantDocumentGroupCounts'
import {VariantMenuButton} from './VariantMenuButton'
import {VariantsEmptyState} from './VariantsEmptyState'
import {variantsOverviewColumnDefs} from './VariantsOverviewColumnDefs'

const VARIANT_TABLE_ROW_ID = '_id'

export function VariantsOverview() {
  const {t} = useTranslation(variantsLocaleNamespace)
  const router = useRouter()
  const {data: variants, error, loading} = useAllVariants()
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateVariantDialogOpen, setIsCreateVariantDialogOpen] = useState(false)

  const handleCreateVariant = useCallback(() => {
    setIsCreateVariantDialogOpen(true)
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
    NonNullable<TableProps<VariantOverviewRow, undefined>['rowActions']>
  >(({datum}) => <VariantMenuButton variant={datum as SystemVariant} />, [])

  const variantsList = useMemo(() => variants ?? [], [variants])
  const documentGroupCounts = useVariantDocumentGroupCounts()

  const variantsWithDocumentCounts = useMemo<VariantOverviewRow[]>(
    () =>
      variantsList.map((variant) => ({
        ...variant,
        documentGroupCount: documentGroupCounts.get(variant._id) ?? 0,
      })),
    [documentGroupCounts, variantsList],
  )

  const filteredVariants = useMemo(
    () => filterVariantsForSearch(variantsWithDocumentCounts, searchQuery),
    [searchQuery, variantsWithDocumentCounts],
  )

  const hasVariants = variantsList.length > 0

  const createVariantButton = useMemo(
    () => (
      <Button
        disabled={isCreateVariantDialogOpen}
        icon={AddIcon}
        onClick={handleCreateVariant}
        text={t('overview.action.create-variant')}
      />
    ),
    [handleCreateVariant, isCreateVariantDialogOpen, t],
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

    return <VariantsEmptyState createVariantButton={createVariantButton} />
  }, [createVariantButton, error, hasVariants, t])

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
              {createVariantButton}
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

          {error && (
            <Card flex="none" padding={3} tone="critical">
              <Text size={1}>{t('overview.error')}</Text>
            </Card>
          )}
        </Flex>
      </Container>

      {/* Full-width scroll region so table borders span the tool pane (same pattern as release detail summary). */}
      <Box flex={1} overflow="auto" ref={setScrollContainerRef}>
        <Table<VariantOverviewRow>
          columnDefs={columnDefs}
          data={filteredVariants}
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
    </Flex>
  )
}
