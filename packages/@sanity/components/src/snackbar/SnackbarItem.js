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
      onAction: PropTypes.func,
      actionTitle: PropTypes.string,
    }).isRequired,
    // Handles the closing of the snack
    onClose: PropTypes.func.isRequired,
    onSetHeight: PropTypes.func.isRequired
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
    this._snackRef = React.createRef()
  }

  handleAutoDismissSnack = () => {
    const { snack, onClose, autoDismissTimeout } = this.props
    this._dimissTimer = setTimeout(() => {
      onClose(snack.key)
    }, autoDismissTimeout)
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

  handleAction = () => {
    const { snack } = this.props
    if(snack.onAction) {
      snack.onAction()
  }
    this.props.onClose(snack.key)
  }

  componentDidMount() {
    const { onSetHeight, snack } = this.props
    const height = this._snackRef.current && this._snackRef.current.clientHeight
    onSetHeight(snack.key, height)
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
        ref={this._snackRef}
        className={rootStyles} 
        style={{bottom: offset, transition: transition}}
        onMouseOver={() => this.handleMouseOver()}
        onMouseLeave={() => this.handleMouseLeave()}>
        <div className={innerStyles}>
          <div className={styles.SnackbarIcon}>{snack.icon}</div>
          <div className={styles.SnackbarMessage}>{snack.message}</div>
          <button 
                onClick={() => this.handleAction()}>
          </button>
        </div>
      </div>
    )
  }
}
