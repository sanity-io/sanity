import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import observeForPreview from './observeForPreview'
import {debounce} from 'lodash'
import shallowEquals from 'shallow-equals'
import scrollPosition from './scrollPosition'

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
    isLoading: true,
    error: null,
    result: null
  }

  componentDidMount() {
    const {lazy} = this.props
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
          // console.log('subscribe due to appear')
          this.subscribe()
        }
        if (disappear) {
          // console.log('unsubscribe due to disappear')
          this.unsubscribe()
        }
        this._isVisible = isVisible
      })
    } else {
      this.subscribe()
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
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!shallowEquals(nextProps.value, this.props.value)) {
      // console.log('resubscribe due to new props')
      // console.log(this.props.value, nextProps.value)
      // console.log('-----')
      this.subscribe()
    }
  }

  subscribe = debounce(() => {
    // console.time('subscribe')
    this._subscribe(this.props.value, this.props.type)
    // console.timeEnd('subscribe')
  }, 100)

  _subscribe(value, type) {
    this.unsubscribe()
    this.subscription = observeForPreview(value, type)
      .subscribe(res => {
        this.setState({
          result: res,
          isLoading: false
        })
      })
  }

  render() {
    const {result, isLoading, error} = this.state
    if (isLoading) {
      return <div style={{visibility: 'hidden'}}>{this.props.children({title: 'abc', subtitle: 'abc'})}</div>
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
