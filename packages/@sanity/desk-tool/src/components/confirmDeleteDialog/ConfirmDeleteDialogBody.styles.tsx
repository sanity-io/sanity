import React from 'react'
import styled from 'styled-components'
import {rem, Text, Card, Box, Inline, Tooltip} from '@sanity/ui'
import {InfoOutlineIcon} from '@sanity/icons'

export const ChevronWrapper = styled(Box)`
  margin-left: auto;
`

export const InternalReferences = styled.ul`
  height: 300px;
  overflow: auto;
  padding: 0;
  margin: 0;
  flex: initial;
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
        {difference} other reference{difference === 1 ? '' : 's'} not shown.
      </Text>
      <Tooltip
        portal
        content={
          <Box padding={2}>
            <Text>
              We can't show metadata about these references because no token with access to the
              datasets they are in was found. Read more about how to configure tokens in the{' '}
              <a href="https://www.sanity.io/docs/cross-dataset-references">
                Cross dataset references documentation
              </a>
            </Text>
          </Box>
        }
      >
        <InfoOutlineIcon />
      </Tooltip>
    </Inline>
  )
}
