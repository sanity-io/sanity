/* eslint-disable react/jsx-filename-extension */

import React from 'react'
import PropTypes from 'prop-types'
import {noop} from 'lodash'
import {DocumentsListPane} from './documentsListPane'
import {UserComponentPane} from './userComponentPane'
import {UnknownPane} from './unknownPane'
import {DocumentPaneProvider} from './documentPane'
import {ListPane} from './listPane'

const paneMap = {
  list: ListPane,
  documentList: DocumentsListPane,
  document: DocumentPaneProvider,
  component: UserComponentPane
}

// eslint-disable-next-line react/prefer-stateless-function
export default class DeskToolPane extends React.PureComponent {
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
    const PaneComponent = paneMap[type] || UnknownPane
    return (
      <PaneComponent
        {...this.props}
        onExpand={this.handlePaneExpand}
        onCollapse={this.handlePaneCollapse}
      />
    )
  }
}
