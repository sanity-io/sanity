import React, {PropTypes} from 'react'
import {bindAll} from 'lodash'
import store from 'datastore:@sanity/base/document'

// todo: make configurable
const DEFAULT_PROPS_MAPPING = {
  result: 'result',
  error: 'error',
  complete: 'complete'
}

export default class QueryContainer extends React.Component {

  static propTypes = {
    query: PropTypes.string,
    mapFn: PropTypes.func,
    children: PropTypes.element,
    params: PropTypes.object
  };

  static defaultProps = {
    mapFn: props => props
  }

  static getInitialState() {
    return {
      result: null,
      complete: false,
      error: false
    }
  }

  constructor(...args) {
    super(...args)

    this.state = QueryContainer.getInitialState()

    bindAll(this, [
      'next',
      'error',
      'complete'
    ])
  }

  componentWillMount() {
    this.subscribe(this.props.query, this.props.params)
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  subscribe(query, params) {
    this._subscription = store.query(query, params).subscribe(this)
  }

  unsubscribe() {
    this._subscription.unsubscribe()
  }

  componentWillReceiveProps(nextProps) {
    const sameQuery = nextProps.query === this.props.query
    const sameParams = nextProps.params === this.props.params

    if (!sameQuery || !sameParams) {
      this.unsubscribe()
      this.subscribe(nextProps.query, nextProps.params)
      this.setState(QueryContainer.getInitialState())
    }
  }

  next(result) {
    this.setState({result})
  }

  error(error) {
    this.setState({error})
  }

  complete() {
    this.setState({complete: true})
  }

  render() {
    return React.cloneElement(React.Children.only(this.props.children), this.props.mapFn(this.state))
  }
}
