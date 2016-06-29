import React, {PropTypes} from 'react'

export default React.createClass({
  propTypes: {
    children: PropTypes.string,
    handleClick: PropTypes.func
  },

  render() {
    const {children, handleClick} = this.props

    const style = {
      display: 'block',
      verticalAlign: 'middle',
      border: 0,
      height: 20,
      lineHeight: '1em',
      background: 'black',
      color: 'white',
      whiteSpace: 'nowrap',
      borderRadius: 10,
      marginBottom: 2
    }

    return (
      <button style={style} onClick={handleClick}>
        {children}
      </button>
    )
  }
})
