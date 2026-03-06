import {Box, Stack} from '@sanity/ui'
import {type ReactNode} from 'react'

interface TableLayoutProps {
  isEmptyState: boolean
  header: ReactNode
  content: ReactNode
  contentHeight?: string
}

/**
 * @internal
 */
export const TableLayout = ({isEmptyState, header, content, contentHeight}: TableLayoutProps) => {
  if (isEmptyState) {
    // Empty state layout - use CSS Grid to fill height
    return (
      <div style={{height: '100%'}}>
        <table
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
          }}
        >
          {header}
          <tbody
            style={{
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {content}
          </tbody>
        </table>
      </div>
    )
  }

  // Normal content layout - use original scrollable structure
  return (
    <Stack as="table">
      {header}
      <Box
        style={{
          height: contentHeight,
          position: 'relative',
        }}
        as="tbody"
      >
        {content}
      </Box>
    </Stack>
  )
}
