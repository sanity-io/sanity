import React, {PropTypes} from 'react'
import Pane from 'component:desk-tool/pane'
import client from 'client:@sanity/base/client'
import equals from 'shallow-equals'

class QueryPane extends React.Component {
  constructor() {
    super()

    this.state = {
      loading: true
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !equals(this.props, nextProps) || !equals(this.state, nextState)
  }

  componentDidMount() {
    client.fetch(this.props.query)
      .then(res => this.setState({loading: false, items: res.result}))
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
  query: PropTypes.string.isRequired,
  activeItem: PropTypes.any,
  basePath: PropTypes.string
}

export default QueryPane
