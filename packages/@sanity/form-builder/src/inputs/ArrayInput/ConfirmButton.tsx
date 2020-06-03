import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/ConfirmButton.css'
import TrashIcon from 'part:@sanity/base/trash-icon'
import PopOver from 'part:@sanity/components/dialogs/popover'

type ConfirmButtonProps = {
  kind?: 'simple'
  onConfirm?: () => void
  title: string
}

type ConfirmButtonState = {
  showConfirmDialog: boolean
}

export default class ConfirmButton extends React.Component<ConfirmButtonProps, ConfirmButtonState> {
  _button: Button | null
  _confirmButton: Button | null
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
  handleClickOutside = event => {
    this.close()
  }
  handleConfirmPopoverClose = event => {
    this.close()
  }
  setButton = (button: Button | null) => {
    this._button = button
  }
  setConfirmButton = (button: Button | null) => {
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
          icon={TrashIcon}
          onClick={this.handleClick}
          padding="small"
          ref={this.setButton}
        />
        {showConfirmDialog && (
          <PopOver
            color="danger"
            useOverlay={false}
            onEscape={this.handleConfirmPopoverClose}
            onClickOutside={this.handleClickOutside}
            padding="none"
          >
            <div className={styles.wrapper}>
              <div tabIndex={0} onFocus={this.handleConfirmPopoverClose} />
              <Button
                color="white"
                inverted
                onClick={onConfirm}
                icon={TrashIcon}
                ref={this.setConfirmButton}
              >
                Confirm remove
              </Button>
              <div tabIndex={0} onFocus={this.handleConfirmPopoverClose} />
            </div>
          </PopOver>
        )}
      </div>
    )
  }
}
