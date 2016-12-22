import React, {PropTypes} from 'react'
import {bindAll} from 'lodash'
import store from 'part:@sanity/base/datastore/document'

function deprecatedCheck(props, propName, componentName, ...rest) {
  if (React.isValidElement(props[propName])) {
    return new Error(
      `Passing a React element as ${propName} to ${componentName} is deprecated. Use a function instead.`
    )
  }
  return PropTypes.func.isRequired(props, propName, componentName, ...rest)
}

function createInitialState() {
  return {
    result: null,
    complete: false,
    loading: false,
    error: false
  }
}

export default class QueryContainer extends React.Component {

  static propTypes = {
    query: PropTypes.string,
    mapFn: PropTypes.func,
    children: deprecatedCheck,
    params: PropTypes.object
  };

  static defaultProps = {
    mapFn: props => props
  }

  state = createInitialState()

  componentWillMount() {
    this.subscribe(this.props.query, this.props.params)
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  subscribe(query, params) {
    this.unsubscribe()
    this._subscription = store.query(query, params).subscribe(this)
  }

  next = result => {
    this.setState({error: null, result})
  }

  error = error => {
    console.error(error) // @todo make sure some kind of error dialog is shown, somewhere
    this.setState({error})
  }

  complete = () => {
    this.setState({complete: true})
  }

  unsubscribe() {
    if (this._subscription) {
      this._subscription.unsubscribe()
    }
  }

  componentWillReceiveProps(nextProps) {
    const sameQuery = nextProps.query === this.props.query
    const sameParams = nextProps.params === this.props.params

    if (!sameQuery || !sameParams) {
      this.setState(createInitialState())
      this.subscribe(nextProps.query, nextProps.params)
    }
  }

  renderDeprecated() {
    return React.cloneElement(React.Children.only(this.props.children), this.props.mapFn(this.state))
  }

  render() {
    const {children, mapFn} = this.props
    if (React.isValidElement(children)) {
      return this.renderDeprecated()
    }
    if (!children || typeof children !== 'function') {
      return <div>Invalid usage of QueryContainer. Expected a function as its only child</div>
    }
    return children(mapFn(this.state))
  }
}
