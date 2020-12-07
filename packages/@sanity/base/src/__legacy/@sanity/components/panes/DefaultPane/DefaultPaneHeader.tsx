import {Layer} from '@sanity/ui'
import React from 'react'
import {useZIndex} from '../../../../../components'

export function DefaultPaneHeader(props: {
  onTitleClick: () => void
  styles: Record<string, string>
  title: React.ReactNode
  tools: React.ReactNode
  viewMenu?: React.ReactNode
}) {
  const {onTitleClick, styles, title, tools, viewMenu} = props
  const zindex = useZIndex()

  return (
    <Layer className={styles.header} zOffset={zindex.pane}>
      <div className={styles.headerContent}>
        <div className={styles.titleContainer}>
          <h2 className={styles.title} onClick={onTitleClick}>
            {title}
          </h2>
        </div>
        <div className={styles.headerTools}>{tools}</div>
      </div>

      {/* To render tabs and similar */}
      {viewMenu && <div className={styles.headerViewMenu}>{viewMenu}</div>}
    </Layer>
  )
}
