import React, {PropTypes} from 'react'

import styles from './styles/Hamburger.css'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'

class Hamburger extends React.Component {

  static propTypes = {
    children: PropTypes.node
  }

  constructor(...args) {
    super(...args)
    this.state = {
      isOpen: false
    }
    this.handleToggle = this.handleToggle.bind(this)
    this.handleOpen = this.handleOpen.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  handleOpen(event) {
    this.setState({
      isOpen: true
    })
  }

  handleClose(event) {
    this.setState({
      isOpen: false
    })
  }

  handleToggle(event) {
    if (this.state.isOpen) {
      this.handleClose(event)
    } else {
      this.handleOpen(event)
    }
  }

  render() {
    const {children} = this.props
    const {isOpen} = this.state
    return (
      <div className={`${isOpen ? styles.isOpen : styles.isClosed}`}>
        <button className={styles.button} onClick={this.handleToggle}>
          <HamburgerIcon color="inherit" />
        </button>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    )
  }
}

export default Hamburger
