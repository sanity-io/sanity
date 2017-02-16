import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import observeForPreview from './observeForPreview'
import shallowEquals from 'shallow-equals'
import scrollPosition from './scrollPosition'
import {capitalize, sampleSize, range, random} from 'lodash'

const chars = 'abcdefghijklmnopqrstuvwxyz'.split('')

function randomWords(minWords = 2, maxWords = 5, minWordLength = 3, maxWordLength = 5) {
  return capitalize(
    range(random(minWords, maxWords))
      .map(() =>
        sampleSize(chars, random(minWordLength, maxWordLength)).join('')
      ).join(' ')
  )
}

export default class PreviewMaterializer extends React.PureComponent {
  static propTypes = {
    value: PropTypes.any.isRequired,
    lazy: PropTypes.bool,
    type: PropTypes.shape({
      preview: PropTypes.shape({
        select: PropTypes.object.isRequired,
        prepare: PropTypes.func
      }).isRequired
    }),
    children: PropTypes.func
  };

  static defaultProps = {
    lazy: true
  }

  state = {
    isDeferred: true,
    isLoading: false,
    error: null,
    result: null
  }

  componentDidMount() {
    const {type, value, lazy} = this.props
    // todo: clean up this code
    if (lazy) {
      this._isVisible = false
      this.scrollSubscription = scrollPosition.subscribe(windowDimension => {
        const element = ReactDOM.findDOMNode(this)
        const rect = element.getBoundingClientRect()
        const isVisible = (
          rect.top >= 0
          && rect.left >= 0
          && rect.bottom <= windowDimension.height
          && rect.right <= windowDimension.width
        )
        const appear = !this._isVisible && isVisible
        const disappear = !isVisible && this._isVisible
        if (appear) {
          this.subscribe(value, type)
        }
        if (disappear) {
          // console.log('unsubscribe due to disappear')
          this.unsubscribe()
        }
        this._isVisible = isVisible
      })
    } else {
      this.subscribe(value, type)
    }
  }

  componentWillUnmount() {
    this.unsubscribe()
    this.scrollSubscription.unsubscribe()
    // console.log('unsubscribe due to unmount')
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
      this.setState({isDeferred: true, isLoading: false})
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!shallowEquals(nextProps.value, this.props.value)) {
      // console.log('resubscribe due to new props')
      // console.log(this.props.value, nextProps.value)
      // console.log('-----')
      this.subscribe(nextProps.value, nextProps.type)
    }
  }

  subscribe(value, type) {
    this.unsubscribe()
    this.setState({isLoading: true})
    this.subscription = observeForPreview(value, type)
      .subscribe(res => {
        this.setState({
          result: res,
          isDeferred: false,
          isLoading: false
        })
      })
  }

  render() {
    const {result, isDeferred, isLoading, error} = this.state

    const childParams = {
      materialized: result,
      isDeferred,
      isLoading,
      error: error
    }

    return this.props.children(childParams)
  }
}
