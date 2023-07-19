import React from 'react'
import styled from 'styled-components'
import {rem, Flex, Text, Box, Tooltip, Container, Inline} from '@sanity/ui'
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
  min-height: 35px;
`

export const OtherReferenceCount = (props: {totalCount: number; references: unknown[]}) => {
  const difference = props.totalCount - props.references.length

  if (!difference) return null

  return (
    <Inline space={2}>
      <Text size={1} muted>
        {difference} other reference{difference === 1 ? '' : 's'} not shown{' '}
      </Text>

      <Tooltip
        portal
        placement="top"
        content={
          <Container width={0}>
            <Box padding={2}>
              <Text size={1}>
                We can't show metadata about these references because no token with access to the
                datasets they are in was found.
              </Text>
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
