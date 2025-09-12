import {Card, Text} from '@sanity/ui'
import {type ComponentType} from 'react'

interface TableEmptyStateProps {
  emptyState: string | ComponentType
  colSpan: number
}

const emptyCellStyle = {
  textAlign: 'center' as const,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const emptyRowStyle = {
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
}

/**
 * @internal
 */
export const TableEmptyState = ({emptyState, colSpan}: TableEmptyStateProps) => {
  if (typeof emptyState === 'string') {
    return (
      <Card borderBottom display="flex" padding={4} as="tr" style={emptyRowStyle}>
        <td colSpan={colSpan} style={emptyCellStyle}>
          <Text muted size={1}>
            {emptyState}
          </Text>
        </td>
      </Card>
    )
  }

  const EmptyStateComponent = emptyState
  return (
    <Card borderBottom display="flex" padding={4} as="tr" style={emptyRowStyle}>
      <td colSpan={colSpan} style={emptyCellStyle}>
        <EmptyStateComponent />
      </td>
    </Card>
  )
}
