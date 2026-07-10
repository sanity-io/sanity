import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Box, Flex, Inline, rem, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {Tooltip} from '../../../ui-components'
import {useTranslation} from '../../i18n'
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
  padding-inline: ${({theme}) => rem(theme.sanity.space[2])};
  border-collapse: collapse;

  th {
    padding: ${({theme}) => rem(theme.sanity.space[1])};
  }

  td {
    padding-block: 0;
    padding-inline: ${({theme}) => rem(theme.sanity.space[1])};
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
      <Inline space={2}>
        <Text size={1} muted>
          {t('document-group.delete.other-reference-count.title', {count: difference})}
        </Text>
        <Tooltip
          portal
          placement="top"
          content={t('document-group.delete.other-reference-count.tooltip')}
        >
          <Text size={1} muted>
            <InfoOutlineIcon />
          </Text>
        </Tooltip>
      </Inline>
    </Box>
  )
}
