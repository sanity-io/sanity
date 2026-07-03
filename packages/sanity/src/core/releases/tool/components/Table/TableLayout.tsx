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
  // display: block makes the tbody the containing block for the absolutely
  // positioned virtualized rows in Safari too — WebKit doesn't support
  // `position: relative` on internal table boxes (https://bugs.webkit.org/show_bug.cgi?id=240961),
  // which left the rows positioned from the top of the table and the first row
  // hidden behind the sticky header
  const tbodyStyle = useMemo<CSSProperties>(
    () =>
      isEmptyState
        ? {display: 'block', height: '100%', position: 'relative', overflow: 'hidden'}
        : {display: 'block', height: contentHeight, position: 'relative'},
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
