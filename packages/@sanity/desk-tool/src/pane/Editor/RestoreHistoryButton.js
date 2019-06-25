import React from 'react'
import PropTypes from 'prop-types'
import {Tooltip} from 'react-tippy'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import styles from '../styles/Editor.css'

export default class RestoreHistoryButton extends React.PureComponent {
  static propTypes = {
    disabled: PropTypes.bool.isRequired,
    onRestore: PropTypes.func.isRequired
  }
  state = {
    showConfirmHistoryRestore: false
  }
  handleCancelHistoryRestore = () => {
    this.setState({showConfirmHistoryRestore: false})
  }
  handleShowHistoryRestore = () => {
    this.setState({showConfirmHistoryRestore: true})
  }
  handleConfirmHistoryRestore = () => {
    const {onRestore} = this.props
    this.setState({showConfirmHistoryRestore: false})
    onRestore()
  }
  render() {
    const {disabled} = this.props
    const {showConfirmHistoryRestore} = this.state
    return (
      <>
        <div>
          <Tooltip
            arrow
            theme="light"
            disabled={'ontouchstart' in document.documentElement}
            className={styles.publishButton}
            html={<div>Restore to this version</div>}
          >
            <Button disabled={disabled} onClick={this.handleShowHistoryRestore} color="primary">
              Restore
            </Button>
          </Tooltip>
          <div className={styles.publishInfoUndoButton}>
            {showConfirmHistoryRestore && (
              <PopOverDialog
                onClickOutside={this.handleCancelHistoryRestore}
                useOverlay={false}
                hasAnimation
              >
                <div>
                  <div className={styles.popOverText}>
                    <strong>Are you sure</strong> you want to restore this document?
                  </div>
                  <ButtonGrid>
                    <Button kind="simple" onClick={this.handleCancelHistoryRestore}>
                      Cancel
                    </Button>
                    <Button color="danger" onClick={this.handleConfirmHistoryRestore}>
                      Restore
                    </Button>
                  </ButtonGrid>
                </div>
              </PopOverDialog>
            )}
          </div>
        </div>
      </>
    )
  }
}
