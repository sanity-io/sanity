import React, {useMemo} from 'react'

import styles from './CustomIcon.module.css'

interface Props {
  icon: string
  active: boolean
}

export default function CustomIcon(props: Props) {
  const {icon, active} = props

  const inlineStyle = useMemo(
    () => ({
      backgroundImage: `url(${icon})`,
      filter: active ? 'invert(100%)' : 'invert(0%)',
    }),
    [active, icon]
  )

  return <div className={styles.root} style={inlineStyle} />
}
