import React from 'react'

export default function Styleable(Component, defaultStyles) {
  function Styled(props) {
    const {styles, ...rest} = props // eslint-disable-line react/prop-types
    return <Component styles={{...styles, ...defaultStyles}} {...rest} />
  }
  Object.assign(Styled, Component)
  Styled.displayName = `Styleable(${Component.displayName || Component.name})`
  return Styled
}
