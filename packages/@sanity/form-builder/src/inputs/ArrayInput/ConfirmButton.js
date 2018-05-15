import PropTypes from 'prop-types'
import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/ConfirmButton.css'
import TrashIcon from 'part:@sanity/base/trash-icon'
import PopOver from 'part:@sanity/components/dialogs/popover'

export default class ConfirmButton extends React.Component {
  _confirmButton: ?Button
  static propTypes = {
    children: PropTypes.func,
    onConfirm: PropTypes.func
  }

  state = {
    showConfirmDialog: false
  }

  close() {
    this.setState({
      showConfirmDialog: false
    })
  }

  open() {
    this.setState({
      showConfirmDialog: true
    })
  }

  handleClick = event => {
    this.open()
  }

  handleConfirmPopoverClose = event => {
    this.close()
  }

  setButton = (button: ?Button) => {
    this._button = button
  }

  setConfirmButton = (button: ?Button) => {
    this._confirmButton = button
  }

  componentDidUpdate(prevProps, prevState) {
    const wasOpen = prevState.showConfirmDialog
    const isOpen = this.state.showConfirmDialog
    if (!wasOpen && isOpen) {
      this._confirmButton.focus()
    } else if (wasOpen && !isOpen) {
      this._button.focus()
    }
  }

  render() {
    const {showConfirmDialog} = this.state
    const {onConfirm, ...rest} = this.props
    return (
      <div className={styles.root}>
        <Button
          {...rest}
          kind="simple"
          icon={TrashIcon}
          onClick={this.handleClick}
          ref={this.setButton}
        />
        <div className={styles.popoverAnchor}>
          {showConfirmDialog && (
            <PopOver
              color="danger"
              useOverlay={false}
              onEscape={this.handleConfirmPopoverClose}
              onClickOutside={this.handleConfirmPopoverClose}
            >
              <div className={styles.wrapper}>
                <Button
                  color="white"
                  inverted
                  onClick={onConfirm}
                  onBlur={this.handleConfirmPopoverClose}
                  icon={TrashIcon}
                  ref={this.setConfirmButton}
                >
                  Confirm remove
                </Button>
              </div>
            </PopOver>
          )}
        </div>
      </div>
    )
  }
}
