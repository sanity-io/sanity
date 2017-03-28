import React, {PropTypes} from 'react'

const DEFAULT_PROPS = {
  styles: {}
}
const PROPTYPES = {
  styles: PropTypes.object
}

export default function Styleable(Component, styles) {
  function Styled(props) {
    const {styles: overrideStyles, ...rest} = props
    return <Component styles={{...overrideStyles, ...styles}} {...rest} />
  }
  Styled.propTypes = PROPTYPES
  Styled.defaultProps = DEFAULT_PROPS
  Styled.displayName = `Styleable(${Component.displayName || Component.name})`
  return Styled
}
