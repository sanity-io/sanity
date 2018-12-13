import PropTypes from 'prop-types'
import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import TrashIcon from 'part:@sanity/base/trash-icon'
import PopOver from 'part:@sanity/components/dialogs/popover'

import styles from './styles/ConfirmButton.css'

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
      // todo: does not work as the popover is not in sync
      //this._confirmButton.focus()
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
