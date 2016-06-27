import React, {PropTypes} from 'react'
import styles from 'style:@sanity/default-layout/action-button'
import ActionModal from './ActionModal'

class ActionButton extends React.Component {
  static propTypes = {
    actions: PropTypes.array
  }

  constructor(props) {
    super(props)

    this.handleToggleModal = this.handleToggleModal.bind(this)

    this.state = {
      modalOpen: false
    }
  }

  handleToggleModal() {
    this.setState({modalOpen: !this.state.modalOpen})
  }

  render() {
    if (this.state.modalOpen) {
      return (
        <ActionModal
          actions={this.props.actions}
          onClose={this.handleToggleModal}
        />
      )
    }

    return (
      <button className={styles.button} onClick={this.handleToggleModal}>➕</button>
    )
  }
}

export default ActionButton
