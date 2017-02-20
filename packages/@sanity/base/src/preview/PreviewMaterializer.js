import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import observeForPreview from './observeForPreview'
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
    isDeferred: true,
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
          rect.top + rect.height >= 0
          && rect.left + rect.width >= 0
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
      this.setState({isDeferred: true})
    }
  }

  componentWillUpdate(nextProps) {
    if (!shallowEquals(nextProps.value, this.props.value)) {
      // console.log('resubscribe due to new props')
      // console.log(this.props.value, nextProps.value)
      // console.log('-----')
      this.subscribe(nextProps.value, nextProps.type)
    }
  }

  subscribe(value, type) {
    this.unsubscribe()
    this.subscription = observeForPreview(value, type)
      .subscribe(res => {
        this.setState({
          result: res,
          isDeferred: false
        })
      })
  }

  render() {
    const {result, isDeferred, error} = this.state
    return this.props.children({
      materialized: result,
      isDeferred,
      error: error
    })
  }
}
