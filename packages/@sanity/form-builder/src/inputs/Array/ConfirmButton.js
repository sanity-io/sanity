import PropTypes from 'prop-types'
import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/ConfirmButton.css'
import TrashIcon from 'part:@sanity/base/trash-icon'
import PopOver from 'part:@sanity/components/dialogs/popover'

export default class ConfirmButton extends React.Component {
  static propTypes = {
    children: PropTypes.func,
    onConfirm: PropTypes.func
  }

  state = {
    showConfirmDialog: false
  }

  handleClick = event => {
    this.setState({
      showConfirmDialog: true
    })
  }

  handleConfirmPopoverClose = event => {
    this.setState({
      showConfirmDialog: false
    })
  }

  render() {
    const {showConfirmDialog} = this.state
    const {onConfirm, ...rest} = this.props
    return (
      <Button
        {...rest}
        tabIndex={0}
        kind="simple"
        color="danger"
        icon={TrashIcon}
        onClick={this.handleClick}
      >
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
                >
                  Confirm remove
                </Button>
              </PopOver>
            )
          }
        </div>
      </Button>
    )
  }
}
