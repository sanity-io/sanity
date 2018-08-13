import React from 'react'
import PropTypes from 'prop-types'

const ARROW_STYLE = {
  fontSize: '0.8em',
  display: 'inline-block',
  width: '1em',
  marginRight: '0.4em'
}

const CONTAINER_STYLE = {
  cursor: 'default',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  outline: 'none',
  marginBottom: '0.5em'
}

export default class Details extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    isOpen: PropTypes.bool,
    title: PropTypes.node
  }

  static defaultProps = {
    title: 'Details',
    isOpen: false
  }

  constructor(props) {
    super()
    this.state = {
      isOpen: props.isOpen
    }
  }

  handleToggle = () => {
    this.setState(prevState => ({isOpen: !prevState.isOpen}))
  }

  render() {
    const {isOpen} = this.state
    const {title, children} = this.props
    return (
      <div>
        <div tabIndex="0" onClick={this.handleToggle} style={CONTAINER_STYLE}>
          <span style={ARROW_STYLE}>{isOpen ? '▼' : '▶'}</span>
          {title}
        </div>
        {isOpen ? children : null}
      </div>
    )
  }
}
