import {type CSSProperties, type ReactNode, useMemo} from 'react'

interface TableLayoutProps {
  isEmptyState: boolean
  header: ReactNode
  content: ReactNode
  contentHeight?: string
}

const emptyTableStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
}

const defaultTableStyle: CSSProperties = {
  width: '100%',
}

/**
 * @internal
 */
export const TableLayout = ({isEmptyState, header, content, contentHeight}: TableLayoutProps) => {
  const tbodyStyle = useMemo<CSSProperties>(
    () =>
      isEmptyState
        ? {height: '100%', position: 'relative', overflow: 'hidden'}
        : {height: contentHeight, position: 'relative'},
    [isEmptyState, contentHeight],
  )

  return (
    <div style={{height: '100%'}}>
      <table style={isEmptyState ? emptyTableStyle : defaultTableStyle}>
        {header}
        <tbody style={tbodyStyle}>{content}</tbody>
      </table>
    </div>
  )
}
