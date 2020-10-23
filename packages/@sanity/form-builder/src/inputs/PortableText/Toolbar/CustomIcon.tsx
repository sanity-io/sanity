import React from 'react'

import styles from './CustomIcon.css'

interface Props {
  icon: string
  active: boolean
}

export default function CustomIcon(props: Props) {
  const {icon, active} = props

  const inlineStyle = {
    backgroundImage: `url(${icon})`,
    filter: active ? 'invert(100%)' : 'invert(0%)',
  }

  return <div className={styles.root} style={inlineStyle} />
}
