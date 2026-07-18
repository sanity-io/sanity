import {Box, Card, Flex, Skeleton, Stack, Text} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type HTMLProps, useMemo} from 'react'
import {StateLink} from 'sanity/router'

import {type UseTranslationResponse, useTranslation} from '../../../i18n'
import {Headers} from '../../../releases/tool/components/Table/TableHeader'
import {type Column, type VisibleColumn} from '../../../releases/tool/components/Table/types'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {getVariantId, getVariantConditionsText, getVariantTitle} from '../util'

/**
 * A variant row in the overview table, with its live document count attached.
 *
 * `documentCount` is `undefined` while the count is being fetched and `null` when it could
 * not be fetched.
 *
 * @internal
 */
export interface TableVariant extends SystemVariant {
  documentCount?: number | null
}

const VariantDocumentsCell: VisibleColumn<TableVariant>['cell'] = ({cellProps, datum}) => {
  if (datum.isLoading || datum.documentCount === undefined) {
    return (
      <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
        <Text size={1}>
          <Skeleton animated radius={1} style={{width: '4ch'}} />
        </Text>
      </Flex>
    )
  }

  return (
    <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
      <Text muted size={1}>
        {datum.documentCount === null ? '-' : datum.documentCount}
      </Text>
    </Flex>
  )
}

const VariantTitleCell: VisibleColumn<TableVariant>['cell'] = ({cellProps, datum: variant}) => {
  const {t} = useTranslation(variantsLocaleNamespace)

  const encodedVariantId = getVariantId(variant._id)

  const VariantLink = useMemo(
    () =>
      forwardRef(function VariantLinkComponent(
        linkProps: HTMLProps<HTMLAnchorElement>,
        ref: ForwardedRef<HTMLAnchorElement>,
      ) {
        return <StateLink {...linkProps} ref={ref} state={{variantId: encodedVariantId}} />
      }),
    [encodedVariantId],
  )

  if (variant.isLoading) {
    return (
      <Box {...cellProps} flex={1} paddingLeft={3} paddingRight={2} paddingY={2} sizing="border">
        <Stack space={2}>
          <Text size={1} weight="medium">
            <Skeleton animated radius={1} style={{width: '16ch'}} />
          </Text>
          <Text muted size={1}>
            <Skeleton animated radius={1} style={{width: '32ch'}} />
          </Text>
        </Stack>
      </Box>
    )
  }

  const conditionsText = getVariantConditionsText(variant.conditions)

  return (
    <Box {...cellProps} flex={1} paddingLeft={3} paddingRight={2} paddingY={1} sizing="border">
      {/* The perspective "pin" was removed here to match the detail page: adopting a variant is a
          global authoring mode that belongs in perspective-bar chrome, not this list. Returns with
          the perspective-bar work. */}
      <Flex align="center" gap={3}>
        <Card as={VariantLink} data-as="a" flex={1} padding={2} radius={2} tone="inherit">
          <Flex align="center" gap={3}>
            <Stack flex={1} space={2}>
              <Text size={1} weight="medium">
                {getVariantTitle(variant)}
              </Text>
              <Text muted size={1}>
                {conditionsText || t('overview.table.no-conditions')}
              </Text>
            </Stack>
          </Flex>
        </Card>
      </Flex>
    </Box>
  )
}

export function variantsOverviewColumnDefs(
  t: UseTranslationResponse<'variants', undefined>['t'],
): Column<TableVariant>[] {
  return [
    {
      id: 'metadata.title',
      sorting: true,
      width: null,
      style: {minWidth: 'min(50%, calc(100vw - 80px))'},
      header: (props) => (
        <Flex
          {...props.headerProps}
          flex={1}
          paddingLeft={3}
          paddingRight={2}
          paddingY={3}
          sizing="border"
        >
          <Headers.SortHeaderButton {...props} text={t('overview.table.variant')} />
        </Flex>
      ),
      cell: VariantTitleCell,
      sortTransform: (variant) => getVariantTitle(variant),
    },
    {
      id: 'documentCount',
      sorting: false,
      width: 120,
      header: ({headerProps}) => (
        <Flex {...headerProps} paddingY={3} sizing="border">
          <Headers.BasicHeader text={t('overview.table.documents')} />
        </Flex>
      ),
      cell: VariantDocumentsCell,
    },
  ]
}
