import React from 'react'

import styles from './TabPanel.css'

interface TabPanelProps {
  'aria-labelledby': string
  children?: React.ReactNode
  className?: string
  id: string
  tabIndex?: number
}

export default function TabPanel(props: TabPanelProps) {
  const className = [styles.root, props.className].filter(Boolean).join(' ')
  return (
    <div
      aria-labelledby={props['aria-labelledby']}
      className={className}
      id={props.id}
      role="tabpanel"
      tabIndex={props.tabIndex === undefined ? 0 : props.tabIndex}
    >
      {props.children}
    </div>
  )
}
