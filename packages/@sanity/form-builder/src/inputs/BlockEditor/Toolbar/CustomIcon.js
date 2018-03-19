// @flow

import React from 'react'

type Props = {
  icon: string,
  active: boolean
}

export default function CustomIcon(props: Props) {
  const {icon, active} = props
  const style = {
    width: '1em',
    height: '1em',
    backgroundImage: `url(${icon})`,
    borderRadius: 'inherit',
    backgroundOrigin: 'content-box',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    transform: 'scale(0.7)',
    filter: active ? 'invert(100%)' : 'invert(0%)'
  }
  return <div style={style} />
}
