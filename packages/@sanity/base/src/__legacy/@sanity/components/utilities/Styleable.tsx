import React from 'react'

export default function Styleable(
  Component: React.ComponentType<{styles: Record<string, string>}>,
  defaultStyles: Record<string, string>
) {
  function Styled(props: {styles: Record<string, string>}) {
    const {styles, ...rest} = props // eslint-disable-line react/prop-types
    return <Component styles={{...defaultStyles, ...styles}} {...rest} />
  }

  Object.assign(Styled, Component)

  Styled.displayName = `Styleable(${Component.displayName || Component.name})`

  return Styled
}
