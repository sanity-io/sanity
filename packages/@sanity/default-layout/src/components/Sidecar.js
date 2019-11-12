import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/Sidecar.css'

class Sidecar extends React.PureComponent {
  // What else does this need to do?
  static propTypes = {
    isOpen: PropTypes.bool
  }

  static defaultProps = {
    isOpen: true
  }

  render() {
    const {isOpen} = this.props
    return (
      <div className={styles.root}>
        <p>I'm a sidecar</p>
        {isOpen && <p>I'm showing hints!</p>}
      </div>
    )
  }
}

export default Sidecar
