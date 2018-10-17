import React from 'react'
import PropTypes from 'prop-types'
import {noop} from 'lodash'
import DocumentsListPane from './DocumentsListPane'
import UserComponentPane from './UserComponentPane'
import UnknownPaneType from './UnknownPaneType'
import EditorPane from './EditorPane'
import ListPane from './ListPane'

const paneMap = {
  list: ListPane,
  documentList: DocumentsListPane,
  document: EditorPane,
  component: UserComponentPane
}

// eslint-disable-next-line react/prefer-stateless-function
export default class Pane extends React.PureComponent {
  static propTypes = {
    index: PropTypes.number,
    title: PropTypes.string,
    type: PropTypes.string.isRequired,
    onCollapse: PropTypes.func,
    onExpand: PropTypes.func
  }

  static defaultProps = {
    title: '',
    index: 0,
    onCollapse: noop,
    onExpand: noop
  }

  handlePaneCollapse = () => this.props.onCollapse(this.props.index)
  handlePaneExpand = () => this.props.onExpand(this.props.index)

  render() {
    const {type} = this.props
    const ActualPane = paneMap[type] || UnknownPaneType
    return (
      <ActualPane
        {...this.props}
        onExpand={this.handlePaneExpand}
        onCollapse={this.handlePaneCollapse}
      />
    )
  }
}
