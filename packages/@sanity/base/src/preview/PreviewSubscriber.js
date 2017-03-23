import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import Observable from '@sanity/observable'
import observeForPreview from './observeForPreview'
import shallowEquals from 'shallow-equals'
import resize$ from './streams/resize'
import scroll$ from './streams/scroll'
import orientationChange$ from './streams/orientationChange'
import visibilityChange$ from './streams/visibilityChange'

function isVisible() {
  return !document.hidden
}

function getViewport() {
  return {
    height: window.innerHeight,
    width: window.innerWidth
  }
}

const MARGIN = 60
function contains(rect, viewport) {
  return (
    rect.top + rect.height >= MARGIN
    && rect.left + rect.width >= MARGIN
    && rect.bottom - rect.height - MARGIN <= viewport.height
    && rect.right - rect.width - MARGIN <= viewport.width
  )
}

function inViewport(element) {
  return () => contains(element.getBoundingClientRect(), getViewport())
}


export default class PreviewSubscriber extends React.PureComponent {
  static propTypes = {
    type: PropTypes.object.isRequired,
    value: PropTypes.any.isRequired,
    children: PropTypes.func
  };

  state = {
    error: null,
    result: {snapshot: null, type: null},
    isLive: false
  }

  componentDidMount() {
    this.subscribe(this.props.value, this.props.type)
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
    if (!shallowEquals(nextProps.value, this.props.value)) {
      this.subscribe(nextProps.value, nextProps.type)
    }
  }

  subscribe(value, type) {
    this.unsubscribe()

    const visibilityOn$ = Observable.of(isVisible())
       .merge(visibilityChange$.map(event => !event.target.hidden))

    const checkViewport = inViewport(ReactDOM.findDOMNode(this))
    const inViewport$ = resize$.merge(scroll$)
      .merge(orientationChange$)
      .map(checkViewport)

    this.subscription = visibilityOn$
      .distinctUntilChanged()
      .switchMap(on => {
        return on ? Observable.of(checkViewport()).merge(inViewport$) : Observable.of(false)
      })
      .distinctUntilChanged()
      // .do(log('in viewport', value._id))
      .switchMap(isInViewport => {
        return isInViewport
          ? observeForPreview(value, type)
          : Observable.of(null)
      })
      .subscribe(result => {
        if (result) {
          this.setState({result, isLive: true})
        } else {
          this.setState({isLive: false})
        }
      })
  }

  render() {
    const {result, isLive, error} = this.state
    const {children: Child, ...rest} = this.props
    return <Child snapshot={result.snapshot} type={result.type} isLive={isLive} error={error} {...rest} />
  }
}
