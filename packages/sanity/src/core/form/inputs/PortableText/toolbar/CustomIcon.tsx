import {useMemo} from 'react'

import {customIconDiv} from './CustomIcon.css'

interface Props {
  icon: string
  active: boolean
}

export function CustomIcon(props: Props) {
  const {icon, active} = props

  const inlineStyle = useMemo(
    () => ({
      backgroundImage: `url(${icon})`,
      filter: active ? 'invert(100%)' : 'invert(0%)',
    }),
    [active, icon],
  )

  return <div className={customIconDiv} style={inlineStyle} />
}
