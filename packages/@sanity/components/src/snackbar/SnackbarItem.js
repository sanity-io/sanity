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
      children: PropTypes.node
    }).isRequired,
    // Handles the closing of the snack
    onClose: PropTypes.func.isRequired,
    autoDismissTimeout: PropTypes.number,
    onSetHeight: PropTypes.func.isRequired
  }

  static defaultProps = {
    snack: {
      kind: 'info'
    },
    autoDismissTimeout: 3000
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
    this.cancelAutoDismissSnack()
   }
  }

  handleMouseLeave = () => {
    if(!this.props.snack.persist) {
      this.handleAutoDismissSnack()
    }
  }

  handleAction = () => {
    const { snack } = this.props
    if(snack.onAction) {
      snack.onAction()
  }
    this.props.onClose(snack.key)
  }

  cancelAutoDismissSnack = () => {
    clearTimeout(this._dimissTimer)
  }

  componentDidMount() {
    const { onSetHeight, snack } = this.props
    const height = this._snackRef.current && this._snackRef.current.clientHeight
    onSetHeight(snack.key, height)

    if(!this.props.snack.persist) {
      this.handleAutoDismissSnack()
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
      : `${styles.root} ${snack.open ? styles.ShowSnack : styles.DismissSnack}`
    const transition = `all ${transitionDuration}ms ease-in-out`
    return (
      <div
        ref={this._snackRef}
        className={rootStyles} 
        style={{bottom: offset, transition: transition}}
        onMouseOver={() => this.handleMouseOver()}
        onMouseLeave={() => this.handleMouseLeave()}>
        <div className={innerStyles}>
          {
            snack.icon &&
          <div className={styles.SnackbarIcon}>{snack.icon}</div>
          }
          <div className={styles.SnackbarContent}>
            <div 
              className={styles.SnackbarMessage} 
              style={snack.children && {fontWeight: 'bold'}}>{snack.message}</div>
            {
              snack.children &&
              <div className={styles.SnackbarChildren}>{snack.children}</div>
            }
            <div className={styles.SnackbarButtons}>
          <button 
                className={styles.SnackbarAction} 
                onClick={() => this.handleAction()}>
                {snack.actionTitle ? snack.actionTitle : 'x'}
          </button>
        </div>
      </div>
        </div>
      </div>
    )
  }
}
