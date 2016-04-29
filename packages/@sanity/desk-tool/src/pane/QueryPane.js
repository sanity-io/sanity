import React, {PropTypes} from 'react'
import Pane from './Pane'
import styles from '../../styles/DeskTool.css'
import client from 'client:@sanity/base/client'

class QueryPane extends React.Component {
  constructor() {
    super()

    this.state = {
      loading: true
    }
  }

  componentDidMount() {
    client.fetch(this.props.query)
      .then(items => this.setState({loading: false, items}))
  }

  render() {
    return (
      <Pane
        items={this.state.items}
        loading={this.state.loading}
        basePath={this.props.basePath}
        activeItem={this.props.activeItem}
      />
    )
  }
}

QueryPane.propTypes = {
  loading: PropTypes.bool,
  items: PropTypes.array,
  activeItem: PropTypes.any,
  previousPathSegment: PropTypes.string
}

export default QueryPane
