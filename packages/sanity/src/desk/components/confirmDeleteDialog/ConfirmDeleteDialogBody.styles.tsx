import React from 'react'
import styled from 'styled-components'
import {rem, Flex, Text, Box, Inline} from '@sanity/ui'
import {InfoOutlineIcon} from '@sanity/icons'
import {structureLocaleNamespace} from '../../i18n'
import {Tooltip} from 'sanity/_internal-ui-components'
import {useTranslation} from 'sanity'

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
  padding: 0 ${({theme}) => rem(theme.sanity.space[2])};
  border-collapse: collapse;

  th {
    padding: ${({theme}) => rem(theme.sanity.space[1])};
  }

  td {
    padding: 0 ${({theme}) => rem(theme.sanity.space[1])};
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
      <Inline space={2}>
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
