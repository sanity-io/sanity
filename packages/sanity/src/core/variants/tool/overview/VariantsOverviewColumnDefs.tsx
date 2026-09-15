import {Card, Skeleton, Stack, Text} from '@sanity/ui'
import {type HTMLProps, useMemo, type RefAttributes} from 'react'
import {StateLink} from 'sanity/router'
import {Flex, Box} from 'ui5'

import {useTranslation, type UseTranslationResponse} from '../../../i18n/hooks/useTranslation'
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
      <Flex {...cellProps} alignItems="center" paddingX={2} paddingY={3}>
        <Text size={1}>
          <Skeleton animated radius={1} style={{width: '4ch'}} />
        </Text>
      </Flex>
    )
  }

  return (
    <Flex {...cellProps} alignItems="center" paddingX={2} paddingY={3}>
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
      function VariantLinkComponent(
        linkProps: HTMLProps<HTMLAnchorElement> & RefAttributes<HTMLAnchorElement>,
      ) {
        const {ref, ...rest} = linkProps
        return <StateLink {...rest} ref={ref} state={{variantId: encodedVariantId}} />
      },
    [encodedVariantId],
  )

  if (variant.isLoading) {
    return (
      <Box {...cellProps} flexBasis="0%" flexGrow={1} paddingLeft={3} paddingRight={2} paddingY={2}>
        <Stack gap={2}>
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
    <Box {...cellProps} flexBasis="0%" flexGrow={1} paddingLeft={3} paddingRight={2} paddingY={1}>
      <Flex alignItems="center" gap={3}>
        <Card as={VariantLink} data-as="a" flex={1} padding={2} radius={2} tone="inherit">
          <Flex alignItems="center" gap={3}>
            {/* min-width: 0 lets the flex child shrink below its content width so a long name
                truncates with a trailing ellipsis instead of overflowing on narrow viewports. */}
            <Stack flex={1} gap={2} style={{minWidth: 0}}>
              <Text size={1} textOverflow="ellipsis" weight="medium">
                {getVariantTitle(variant)}
              </Text>
              <Text muted size={1} textOverflow="ellipsis">
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
          flexBasis="0%"
          flexGrow={1}
          paddingLeft={3}
          paddingRight={2}
          paddingY={3}
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
        <Flex {...headerProps} paddingY={3}>
          <Headers.BasicHeader text={t('overview.table.documents')} />
        </Flex>
      ),
      cell: VariantDocumentsCell,
    },
  ]
}
