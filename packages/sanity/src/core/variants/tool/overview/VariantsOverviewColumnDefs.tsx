import {BlockElementIcon} from '@sanity/icons/BlockElement'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Badge, Box, Card, Flex, Skeleton, Stack, Text} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type HTMLProps, useMemo} from 'react'
import {StateLink} from 'sanity/router'

import {Tooltip} from '../../../../ui-components'
import {type UseTranslationResponse, useTranslation} from '../../../i18n'
import {Headers} from '../../../releases/tool/components/Table/TableHeader'
import {type Column, type VisibleColumn} from '../../../releases/tool/components/Table/types'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {
  getForkedFromSetReference,
  getVariantSetReference,
  type VariantSetReference,
} from '../../util/variantSet'
import {getVariantId, getVariantConditionsText, getVariantTitle} from '../util'

/**
 * A variant row in the overview table, with its live document count attached.
 *
 * `documentCount` is `undefined` while the count is being fetched and `null` when it could
 * not be fetched.
 *
 * A row can also be a synthetic *set aggregate* — one collapsible header standing in for all of a
 * set's generated members, so a large set doesn't flood the table. Aggregate rows carry
 * `isSetAggregate` and the expand state/toggle; their `documentCount` is the members' total.
 *
 * @internal
 */
export interface TableVariant extends SystemVariant {
  documentCount?: number | null
  isSetAggregate?: boolean
  setReference?: VariantSetReference
  setChildCount?: number
  isSetExpanded?: boolean
  onToggleSet?: () => void
  isSetChild?: boolean
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

  if (variant.isSetAggregate) {
    return (
      <Box {...cellProps} flex={1} paddingLeft={3} paddingRight={2} paddingY={2} sizing="border">
        <Card
          as="button"
          data-testid="variant-set-aggregate-toggle"
          onClick={variant.onToggleSet}
          padding={2}
          radius={2}
          tone="inherit"
          type="button"
        >
          <Flex align="center" gap={2}>
            <Text size={1}>
              {variant.isSetExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </Text>
            {/* A set icon prefix (instead of a "Set" text badge) keeps the label short. */}
            <Tooltip
              content={
                <Box padding={2}>
                  <Text size={1}>{t('overview.badge.set.tooltip')}</Text>
                </Box>
              }
              portal
            >
              <Text size={1}>
                <BlockElementIcon />
              </Text>
            </Tooltip>
            <Text size={1} weight="medium">
              {variant.setReference?.name}
            </Text>
            <Text muted size={1}>
              {t(
                variant.setChildCount === 1
                  ? 'overview.set-group.count_one'
                  : 'overview.set-group.count_other',
                {count: variant.setChildCount ?? 0},
              )}
            </Text>
          </Flex>
        </Card>
      </Box>
    )
  }

  const conditionsText = getVariantConditionsText(variant.conditions)
  const setReference = getVariantSetReference(variant)
  const forkedFromReference = getForkedFromSetReference(variant)

  return (
    <Box
      {...cellProps}
      flex={1}
      paddingLeft={variant.isSetChild ? 6 : 3}
      paddingRight={2}
      paddingY={1}
      sizing="border"
    >
      {/* The perspective "pin" was removed here to match the detail page: adopting a variant is a
          global authoring mode that belongs in perspective-bar chrome, not this list. Returns with
          the perspective-bar work. */}
      <Flex align="center" gap={3}>
        <Card as={VariantLink} data-as="a" flex={1} padding={2} radius={2} tone="inherit">
          <Flex align="center" gap={3}>
            <Stack flex={1} space={2}>
              <Flex align="center" gap={2}>
                <Text size={1} weight="medium">
                  {getVariantTitle(variant)}
                </Text>
                {setReference && !variant.isSetChild && (
                  <Tooltip
                    content={
                      <Box padding={2}>
                        <Text size={1}>{t('overview.badge.set.tooltip')}</Text>
                      </Box>
                    }
                    portal
                  >
                    <Badge fontSize={0} mode="outline" tone="primary">
                      {t('overview.badge.set')}
                    </Badge>
                  </Tooltip>
                )}
                {forkedFromReference && (
                  <Tooltip
                    content={
                      <Box padding={2}>
                        <Text size={1}>{t('overview.badge.forked.tooltip')}</Text>
                      </Box>
                    }
                    portal
                  >
                    <Badge fontSize={0} mode="outline" tone="caution">
                      {t('overview.badge.forked')}
                    </Badge>
                  </Tooltip>
                )}
              </Flex>
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
      // Sort set members (and the set's aggregate header) by the set name so a set stays clustered
      // as one block; the aggregate is inserted before its children and V8's stable sort keeps that
      // order among the equal keys. Standalone definitions sort by their own title.
      sortTransform: (variant) =>
        variant.setReference?.name ??
        getVariantSetReference(variant)?.name ??
        getVariantTitle(variant),
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
