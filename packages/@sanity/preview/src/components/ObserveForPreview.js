import PropTypes from 'prop-types'
import React from 'react'
import {get} from 'lodash'
import shallowEquals from 'shallow-equals'
import WarningIcon from 'part:@sanity/base/warning-icon'
import observeForPreview from '../observeForPreview'
import {INVALID_PREVIEW_CONFIG} from '../constants'

const INVALID_PREVIEW_FALLBACK = {
  title: <span style={{fontStyle: 'italic'}}>Invalid preview config</span>,
  subtitle: <span style={{fontStyle: 'italic'}}>Check the error log in the console</span>,
  media: WarningIcon
}

const INITIAL_STATE = {
  error: null,
  isLoading: false,
  result: {snapshot: null, type: null}
}

export default class PreviewSubscriber extends React.Component {
  static propTypes = {
    type: PropTypes.object.isRequired,
    fields: PropTypes.arrayOf(PropTypes.oneOf(['title', 'description', 'imageUrl'])),
    value: PropTypes.any.isRequired,
    ordering: PropTypes.object,
    children: PropTypes.func
  }

  state = INITIAL_STATE

  componentDidMount() {
    this.subscribe(this.props.value, this.props.type, this.props.fields)
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
  }

  componentWillUpdate(nextProps) {
    if (get(nextProps, 'value._id') !== get(this.props, 'value._id')) {
      this.setState(INITIAL_STATE)
    }

    if (!shallowEquals(nextProps.value, this.props.value)) {
      this.subscribe(nextProps.value, nextProps.type)
    }
  }

  subscribe(value, type, fields) {
    this.unsubscribe()

    const viewOptions = this.props.ordering ? {ordering: this.props.ordering} : {}

    this.setState({isLoading: true})
    this.subscription = observeForPreview(value, type, fields, viewOptions).subscribe(result => {
      this.setState({isLoading: false, result})
    })
  }

  render() {
    const {result, error, isLoading} = this.state
    const {children} = this.props
    const snapshot =
      result.snapshot === INVALID_PREVIEW_CONFIG ? INVALID_PREVIEW_FALLBACK : result.snapshot

    return children({result: {...result, snapshot}, error, isLoading})
  }
}
