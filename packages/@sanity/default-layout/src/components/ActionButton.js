import PropTypes from 'prop-types'
import React from 'react'
import ActionModal from './ActionModal'
import Fab from 'part:@sanity/components/buttons/fab'

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
      <Fab onClick={this.handleToggleModal} ripple colored />
    )
  }
}

export default ActionButton
