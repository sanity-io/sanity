import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Inline, rem, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {styled} from 'styled-components'
import {Flex, Box} from 'ui5'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {structureLocaleNamespace} from '../../i18n'

export const ChevronWrapper = styled(Box)`
  margin-left: auto;
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
  width: 100%;
  text-align: left;
  padding: 0
    ${({theme}) => rem(theme.sanity.space[2]) /* oxlint-disable-line no-deprecated -- will fix in follow up PR */};
  border-collapse: collapse;

  th {
    padding: ${({theme}) => rem(theme.sanity.space[1]) /* oxlint-disable-line no-deprecated -- will fix in follow up PR */};
  }

  td {
    padding: 0
      ${({theme}) => rem(theme.sanity.space[1]) /* oxlint-disable-line no-deprecated -- will fix in follow up PR */};
  }

  tr > *:last-child {
    text-align: right;
  }
`

export const DocumentIdFlex = styled(Flex)`
  min-height: 33px;
`

export const OtherReferenceCount = (props: {totalCount: number; references: unknown[]}) => {
  const {t} = useTranslation(structureLocaleNamespace)
  const difference = props.totalCount - props.references.length

  if (!difference) return null

  return (
    <Box padding={2}>
      <Inline gap={2}>
        <Text size={1} muted>
          {t('confirm-delete-dialog.other-reference-count.title', {count: difference})}
        </Text>

        <Tooltip
          portal
          placement="top"
          content={t('confirm-delete-dialog.other-reference-count.tooltip')}
        >
          <Text size={1} muted>
            <InfoOutlineIcon />
          </Text>
        </Tooltip>
      </Inline>
    </Box>
  )
}
