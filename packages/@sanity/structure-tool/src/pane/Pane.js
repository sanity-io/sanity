import React from 'react'
import PropTypes from 'prop-types'
import Dump from '../utils/Dump'
import contentStylesOverride from './styles/contentStylesOverride.css'
import DocumentsListPane from './DocumentsListPane'
import EditorPane from './EditorPane'
import ListPane from './ListPane'

// eslint-disable-next-line react/prefer-stateless-function
export default class Pane extends React.PureComponent {
  static propTypes = {
    index: PropTypes.number,
    title: PropTypes.string,
    type: PropTypes.string.isRequired
  }

  static defaultProps = {
    title: '',
    index: 0
  }

  resolvePane() {
    switch (this.props.type) {
      case 'list':
        return ListPane
      case 'documentList':
        return DocumentsListPane
      case 'document':
        return EditorPane
      default:
        // @todo Use some "pane type not defined" pane?
        return Dump
    }
  }

  render() {
    const styles = this.props.index === 0 ? contentStylesOverride : {}
    const ActualPane = this.resolvePane()
    return <ActualPane styles={styles} {...this.props} />
  }
}
