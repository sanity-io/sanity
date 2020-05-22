import React from 'react'
import ActionModal from './ActionModal'
import Fab from 'part:@sanity/components/buttons/fab'

interface Props {
  actions: {icon?: React.ComponentType<{}>}[]
}

interface State {
  modalOpen: boolean
}

class ActionButton extends React.PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.handleToggleModal = this.handleToggleModal.bind(this)

    this.state = {
      modalOpen: false
    }
  }

  handleToggleModal() {
    this.setState(state => ({modalOpen: !state.modalOpen}))
  }

  render() {
    if (this.state.modalOpen) {
      return <ActionModal actions={this.props.actions} onClose={this.handleToggleModal} />
    }

    return <Fab onClick={this.handleToggleModal} colored />
  }
}

export default ActionButton
