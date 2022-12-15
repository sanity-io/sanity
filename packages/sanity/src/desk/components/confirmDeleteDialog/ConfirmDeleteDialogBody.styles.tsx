import i18n from 'i18next'
import k from './../../../i18n/keys'
import React from 'react'
import styled from 'styled-components'
import {rem, Flex, Text, Card, Box, Tooltip, Container, Inline} from '@sanity/ui'
import {InfoOutlineIcon} from '@sanity/icons'

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

export const TableContainer = styled(Box).attrs({paddingX: 2, paddingBottom: 2})`
  overflow: auto;
  max-height: 150px;
`

export const Table = styled.table`
  width: 100%;
  text-align: left;
  padding: 0 ${({theme}) => rem(theme.sanity.space[2])};
  border-collapse: collapse;

  th {
    padding: ${({theme}) => rem(theme.sanity.space[1])};
  }

  thead > tr {
    position: sticky;
    top: 0;
    background: var(--card-bg-color);
    z-index: 1;
  }

  td {
    padding: 0 ${({theme}) => rem(theme.sanity.space[1])};
  }

  tr > *:last-child {
    text-align: right;
  }
`

export const DocumentIdFlex = styled(Flex)`
  min-height: 35px;
`

export const ReferencesCard = styled(Card).attrs({
  radius: 2,
  shadow: 1,
  marginBottom: 4,
  flex: 'auto',
})`
  overflow: hidden;
  min-height: 150px;
`

export const OtherReferenceCount = (props: {totalCount: number; references: unknown[]}) => {
  const difference = props.totalCount - props.references.length

  if (!difference) return null

  return (
    <Inline space={2}>
      <Text size={1} muted>
        {difference} {i18n.t(k.OTHER_REFERENCE)}
        {difference === 1 ? '' : i18n.t(k.S)} {i18n.t(k.NOT_SHOWN)}{' '}
      </Text>

      <Tooltip
        portal
        placement="top"
        content={
          <Container width={0}>
            <Box padding={2}>
              <Text size={1}>{i18n.t(k.WE_CAN_T_SHOW_METADATA_ABOUT_T)}</Text>
            </Box>
          </Container>
        }
      >
        <Text size={1} muted>
          <InfoOutlineIcon />
        </Text>
      </Tooltip>
    </Inline>
  )
}
