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
    this._button.focus()
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
    if (!prevState.showConfirmDialog && this.state.showConfirmDialog) {
      // This is a hack needed because popovers doesn't render its children immediately.
      // When this is fixed, we can call this._confirmButton.focus() immediately
      setTimeout(() => {
        if (this._confirmButton) {
          this._confirmButton.focus()
        }
      }, 0)
    }
  }

  render() {
    const {showConfirmDialog} = this.state
    const {onConfirm, ...rest} = this.props
    return (
      <div className={styles.root}>
        <Button
          {...rest}
          tabIndex={0}
          kind="simple"
          color="danger"
          icon={TrashIcon}
          onClick={this.handleClick}
          ref={this.setButton}
        />
        <div className={styles.popoverAnchor}>
          {
            showConfirmDialog && (
              <PopOver
                color="danger"
                useOverlay={false}
                onClose={this.handleConfirmPopoverClose}
              >
                <Button
                  kind="simple"
                  onClick={onConfirm}
                  icon={TrashIcon}
                  ref={this.setConfirmButton}
                >
                  Confirm remove
                </Button>
              </PopOver>
            )
          }
        </div>
      </div>
    )
  }
}
