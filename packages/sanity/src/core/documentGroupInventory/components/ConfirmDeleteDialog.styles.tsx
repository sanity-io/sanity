import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Inline, rem} from '@sanity/ui'
import {styled} from 'styled-components'
import {Text, Box, Flex, Icon} from 'ui5'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'

export const ChevronWrapper = styled(Box)`
  margin-inline-start: auto;
`

export const CrossDatasetReferencesDetails = styled.details`
  flex: none;

  &[open] ${ChevronWrapper} {
    transform: rotate(180deg);
  }
`

export const CrossDatasetReferencesSummary = styled.summary`
  list-style: none;

  &::-webkit-details-marker {
    display: none;
  }
`

export const Table = styled.table`
  inline-size: 100%;
  text-align: start;
  padding-block: 0;
  padding-inline: ${({theme}) => rem(theme.sanity.space[2]) /* oxlint-disable-line no-deprecated -- will fix in follow up PR */};
  border-collapse: collapse;

  th {
    padding: ${({theme}) => rem(theme.sanity.space[1]) /* oxlint-disable-line no-deprecated -- will fix in follow up PR */};
  }

  td {
    padding-block: 0;
    padding-inline: ${({theme}) => rem(theme.sanity.space[1]) /* oxlint-disable-line no-deprecated -- will fix in follow up PR */};
  }

  tr > *:last-child {
    text-align: end;
  }
`

export const DocumentIdFlex = styled(Flex)`
  min-block-size: 33px;
`

export const OtherReferenceCount = (props: {totalCount: number; references: unknown[]}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const difference = props.totalCount - props.references.length

  if (!difference) {
    return null
  }

  return (
    <Box padding={2}>
      <Inline gap={2}>
        <Text size={1} muted as="div" trim={true}>
          {t('document-group.delete.other-reference-count.title', {count: difference})}
        </Text>
        <Tooltip
          portal
          placement="top"
          content={t('document-group.delete.other-reference-count.tooltip')}
        >
          <Icon icon={InfoOutlineIcon} size={1} muted style={{margin: '-0.375rem'}} />
        </Tooltip>
      </Inline>
    </Box>
  )
}
