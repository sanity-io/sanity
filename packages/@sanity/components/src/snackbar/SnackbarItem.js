import React from 'react'
import PropTypes from 'prop-types'
import styles from './styles/SnackbarItem.css'

/*
  TODO:

  Functionality:
  - Recieve action

  Accessibility fixes:
  - aria-role
  - aria-labelledby
  - focus

*/

export default class SnackbarItem extends React.Component {
  static propTypes = {
    // The offset of the snack in the viewport
    offset: PropTypes.number,
    transitionDuration: PropTypes.number.isRequired,
    snack: PropTypes.shape({
      message: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.node,
      ]).isRequired,
      kind: PropTypes.oneOf(['danger', 'info', 'warning', 'error', 'success']).isRequired,
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      key: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
      ]).isRequired,
      persist: PropTypes.bool,
      open: PropTypes.bool
    }).isRequired,
    // Handles the closing of the snack
    onClose: PropTypes.func.isRequired,
    // Milliseconds to wait before hiding the snack by calling onClose
    autoHideTimeout: PropTypes.number
  }

  static defaultProps = {
    snack: {
      kind: 'info'
    },
    autoHideTimeout: 3000,
    transitionDuration: 200
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      enter: true
    }
  }

  handleAutoHideSnack = () => {
    const { snack, onClose, autoHideTimeout } = this.props
    this._timerId = setTimeout(() => {
      onClose(snack.key)
    }, autoHideTimeout)
  }

  handleMouseOver = () => {
   if(!this.props.snack.persist) {
    this.cancelAutoHideSnack()
   }
  }

  handleMouseLeave = () => {
    if(!this.props.snack.persist) {
      this.handleAutoHideSnack()
    }
  }

  cancelAutoHideSnack = () => {
    clearTimeout(this._timerId)
  }

  componentDidMount() {
    if(!this.props.snack.persist) {
      this.handleAutoHideSnack()
    }
    setTimeout(() => {
      this.setState({
        enter: false
      })
    }, 100)
  }

  render() {
    const { enter, size } = this.state
    const {snack, offset, onClose, transitionDuration} = this.props
    const innerStyles = `${styles.inner} ${styles[snack.kind]}`
    const rootStyles = enter 
      ? `${styles.root}` 
      : `${styles.root} ${snack.open ? styles.ShowSnack : styles.HideSnack}`
    const transition = `all ${transitionDuration}ms ease-in-out`
    return (
      <div
        className={rootStyles} 
        style={{bottom: offset, transition: transition}}
        onMouseOver={() => this.handleMouseOver()}
        onMouseLeave={() => this.handleMouseLeave()}>
        <div className={innerStyles}>
          <div className={styles.SnackbarIcon}>{snack.icon}</div>
          <div className={styles.SnackbarMessage}>{snack.message}</div>
          <button 
            className={styles.SnackbarClose} 
            onClick={() => onClose(snack.key)}>
            x
          </button>
        </div>
      </div>
    )
  }
}
