import React, {useMemo} from 'react'
import styled from 'styled-components'

interface Props {
  icon: string
  active: boolean
}

const CustomIconDiv = styled.div`
  width: 1em;
  height: 1em;
  border-radius: inherit;
  background-origin: content-box;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  transform: scale(0.7);
`

export function CustomIcon(props: Props) {
  const {icon, active} = props

  const inlineStyle = useMemo(
    () => ({
      backgroundImage: `url(${icon})`,
      filter: active ? 'invert(100%)' : 'invert(0%)',
    }),
    [active, icon]
  )

  return <CustomIconDiv style={inlineStyle} />
}
