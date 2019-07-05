import React from 'react'
import PropTypes from 'prop-types'
import {Portal} from '../utilities/Portal'
import styles from './styles/SnackbarItem.css'
import Button from 'part:@sanity/components/buttons/default'

export default class SnackbarItem extends React.Component {
  static propTypes = {
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
      open: PropTypes.bool.isRequired,
      onAction: PropTypes.func,
      actionTitle: PropTypes.string,
      children: PropTypes.node,
      setFocus: PropTypes.bool
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    autoDismissTimeout: PropTypes.number,
    onSetHeight: PropTypes.func.isRequired,
    tabIndex: PropTypes.number.isRequired
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
    const { snack } = this.props
   if(!snack.persist) {
    this.cancelAutoDismissSnack()
   }
  }

  handleMouseLeave = () => {
    const { snack } = this.props
    if(!snack.persist) {
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

    if(snack.setFocus) {
      this._snackRef.current.focus()
    }

    const height = this._snackRef.current && this._snackRef.current.clientHeight
    onSetHeight(snack.key, height)

    if(!snack.persist) {
      this.handleAutoDismissSnack()
    }

    if(snack.setFocus) {
      this.cancelAutoDismissSnack()
    }

    setTimeout(() => {
      this.setState({
        enter: false
      })
    }, 100)
  }

  render() {
    const { enter, size } = this.state
    const { snack, offset, onClose, transitionDuration, tabIndex } = this.props

    const rootStyles = enter 
      ? `${styles.root}` 
      : `${styles.root} ${snack.open ? styles.ShowSnack : styles.DismissSnack}`
    const innerStyles = `${styles.inner} ${styles[snack.kind]}`
    const transition = `all ${transitionDuration}ms ease-in-out`

    return (
      <Portal>
        <div
          role="alert"
          aria-label={snack.kind}
          aria-describedby="SnackbarMessage"
          aria-live="alert"
          tabIndex={tabIndex}
          ref={this._snackRef}
          className={rootStyles} 
          style={{bottom: offset, transition: transition}}
          onMouseOver={() => this.handleMouseOver()}
          onMouseLeave={() => this.handleMouseLeave()}
          onFocus={() => this.handleMouseOver()}
          onBlur={() => this.handleMouseLeave()}>
          <div className={innerStyles}>
            {
              snack.icon &&
              <div role="img" className={styles.SnackbarIcon}>{snack.icon}</div>
            }
            <div className={styles.SnackbarContent}>
              <div
                id="SnackbarMessage"
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
                  {snack.actionTitle ? snack.actionTitle : <span aria-label="close" role="img">x</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    )
  }
}
