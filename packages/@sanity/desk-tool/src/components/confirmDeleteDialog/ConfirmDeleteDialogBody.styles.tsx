import React from 'react'
import styled from 'styled-components'
import {Text, Card} from '@sanity/ui'
import {ChevronDownIcon} from '@sanity/icons'

export const InternalReferences = styled.ul`
  height: 300px;
  overflow: auto;
  padding: 0;
  margin: 0;
  flex: 0 1 auto;

  & > li:not(:last-child) {
    /* margin-bottom: 1.25rem; */
  }
`

export const Chevron = styled(ChevronDownIcon)`
  margin-left: auto;
  font-size: 1.25rem;
  color: var(--card-muted-fg-color);
`

export const CrossDatasetReferences = styled.details`
  flex: 0 0 auto;
  &[open] ${Chevron} {
    transform: rotate(180deg);
  }
`

export const CrossDatasetReferencesSummary = styled.summary`
  list-style: none;
  padding: 1.25rem;
  display: flex;
  align-items: center;

  &::-webkit-details-marker {
    display: none;
  }

  & > *:not(:last-child) {
    margin-right: 1.25rem;
  }
`

export const TableContainer = styled.div`
  overflow: auto;
  max-height: 150px;
  padding: 0 0.5rem 0.5rem 0.5rem;
`

export const Table = styled.table`
  width: 100%;
  text-align: left;
  padding: 0 0.75rem;
  border-collapse: collapse;

  th {
    padding: 0.5rem;
  }

  td {
    padding: 0 0.5rem;
  }

  tr > *:last-child {
    text-align: right;
  }
`

export const ReferencesCard = styled(Card)`
  display: flex !important;
  flex-direction: column;
  flex: 1 1 auto;
  overflow: hidden;
  min-height: 150px;
`

export const OtherReferenceCount = (props: {totalCount: number; references: unknown[]}) => {
  const difference = props.totalCount - props.references.length

  if (!difference) return null

  return (
    <Text size={1} muted>
      {difference} other reference{difference === 1 ? '' : 's'} not shown
    </Text>
  )
}
