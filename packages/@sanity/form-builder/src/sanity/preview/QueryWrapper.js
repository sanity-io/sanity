import React, {PropTypes} from 'react'
import {fetchQuery} from '../data/fetch'
import equals from 'shallow-equals'

export default class QueryWrapper extends React.PureComponent {

  static propTypes = {
    query: PropTypes.string.isRequired,
    params: PropTypes.object
  };

  state = {
    loading: false,
    error: null,
    result: null
  }

  componentWillMount() {
    this.fetch(this.props.query, this.props.params)
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state !== nextState
      || this.props.query !== nextProps.query
      || !equals(this.props.params, nextProps.params)
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.query !== nextProps.query || !equals(this.props.params, nextProps.params)) {
      this.fetch(nextProps.query, nextProps.params)
    }
  }

  fetch(query, params) {
    this.setState({loading: true, error: null})
    fetchQuery(query, params)
      .then(result => {
        this.setState({result: result, loading: false})
    }, error => {
        this.setState({error: error, loading: false})
      })
  }

  render() {
    const {result, loading, error} = this.state
    if (loading) {
      return <div>Loading…</div>
    }
    if (error) {
      return <div>Error: {error.message}</div>
    }
    if (!result) {
      return <div />
    }
    return this.props.children(result)
  }
}
