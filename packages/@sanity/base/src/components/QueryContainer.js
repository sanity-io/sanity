import PropTypes from 'prop-types'
import React from 'react'
import {throttle, union} from 'lodash'
import {filter} from 'rxjs/operators'
import store from 'part:@sanity/base/datastore/document'
import shallowEquals from 'shallow-equals'

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
    loading: true,
    error: false
  }
}

function keysEqual(object, otherObject, excludeKeys = []) {
  const objectKeys = Object.keys(object).filter(key => !excludeKeys.includes(key))
  const otherObjectKeys = Object.keys(otherObject).filter(key => !excludeKeys.includes(key))

  if (objectKeys.length !== otherObjectKeys.length) {
    return false
  }

  return union(objectKeys, otherObjectKeys).every(key => object[key] === otherObject[key])
}

const RESPOND_TO_TRANSITIONS = [
  'appear',
  'disappear',
  'update' // todo: remove this
]

export default class QueryContainer extends React.Component {
  static propTypes = {
    query: PropTypes.string,
    params: PropTypes.object,
    mapFn: PropTypes.func,
    children: deprecatedCheck
  }

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
    this._subscription = store
      .query(query, params)
      .pipe(
        filter(
          event => event.type === 'snapshot' || RESPOND_TO_TRANSITIONS.includes(event.transition)
        )
      )
      .subscribe(this)
  }

  next = event => {
    switch (event.type) {
      case 'snapshot': {
        this.setState({error: null, loading: false, result: {documents: event.documents}})
        break
      }
      case 'mutation': {
        this.receiveMutations(event)
        break
      }
      default:
    }
  }

  error = error => {
    // @todo make sure some kind of error dialog is shown, somewhere
    console.error(error) // eslint-disable-line no-console
    this.setState({error, loading: false})
  }

  complete = () => {
    this.setState({complete: true, loading: false})
  }

  receiveMutations(event) {
    // todo: apply mutations on this.state.collection
    // just resubcribing for now.
    /*
    const exampleEvent = {
      type: 'mutation',
      eventId: 'yr50wh-mzc-lby-hcf-3zumkc867#public/hi3HUGlrHu2c292ZddrZes',
      documentId: 'public/hi3HUGlrHu2c292ZddrZes',
      transactionId: 'yr50wh-mzc-lby-hcf-3zumkc867',
      transition: 'disappear',
      identity: 'Z29vZ2xlX29hdXRoMjo6MTA2MTc2MDY5MDI1MDA3MzA5MTAwOjozMjM=',
      mutations: [
        {
          delete: {
            id: 'public/hi3HUGlrHu2c292ZddrZes'
          }
        }
      ],
      previousRev: 'm5qsec-ovr-cv8-i1q-qck9otism',
      resultRev: 'yr50wh-mzc-lby-hcf-3zumkc867',
      timestamp: '2016-12-22T12:24:02.433897Z'
    }
     */
    const {result} = this.state

    const hasCreateOrDelete =
      event.type === 'mutation' &&
      event.mutations.some(
        mut =>
          mut.create ||
          (mut.delete && (result.documents || []).some(doc => doc._id === mut.delete.id))
      )

    if (hasCreateOrDelete) {
      this.refresh()
      this.refresh() // invoke on both ends to make sure we get the refreshed result
    }
  }

  refresh = throttle(
    () => {
      this.subscribe(this.props.query, this.props.params)
    },
    1000,
    {leading: true, trailing: true}
  )

  unsubscribe() {
    if (this._subscription) {
      this._subscription.unsubscribe()
    }
  }

  componentWillUpdate(nextProps) {
    const sameQuery = nextProps.query === this.props.query
    const sameParams = shallowEquals(nextProps.params, this.props.params)

    if (!sameQuery || !sameParams) {
      this.setState(createInitialState())
      this.subscribe(nextProps.query, nextProps.params)
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!shallowEquals(this.state, nextState)) {
      return true
    }
    if (
      nextProps.query !== this.props.query ||
      !shallowEquals(nextProps.params, this.props.params)
    ) {
      return true
    }

    return !keysEqual(nextProps, this.props, ['mapFn', 'query', 'params'])
  }

  renderDeprecated() {
    return React.cloneElement(
      React.Children.only(this.props.children),
      this.props.mapFn(this.state)
    )
  }

  render() {
    const {children, mapFn, ...rest} = this.props
    if (React.isValidElement(children)) {
      return this.renderDeprecated()
    }
    if (!children || typeof children !== 'function') {
      return <div>Invalid usage of QueryContainer. Expected a function as its only child</div>
    }
    return children({...rest, onRetry: this.refresh, ...mapFn(this.state)})
  }
}
