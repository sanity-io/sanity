import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import Observable from '@sanity/observable'
import observeForPreview from './observeForPreview'
import shallowEquals from 'shallow-equals'
import resize$ from './streams/resize'
import scroll$ from './streams/scroll'
import orientationChange$ from './streams/orientationChange'
import visibilityChange$ from './streams/visibilityChange'

const log = (...outer) => (...inner) => console.log(...outer, ...inner)

function isVisible() {
  return !document.hidden
}

function getViewport() {
  return {
    height: window.innerHeight,
    width: window.innerWidth
  }
}

function contains(rect, viewport) {
  return (
    rect.top + rect.height >= 60
    && rect.left + rect.width >= 60
    && rect.bottom - 60 <= viewport.height
    && rect.right - 60 <= viewport.width
  )
}

function inViewport(element) {
  return () => contains(element.getBoundingClientRect(), getViewport())
}


export default class PreviewSubscriber extends React.PureComponent {
  static propTypes = {
    value: PropTypes.any.isRequired,
    type: PropTypes.shape({
      preview: PropTypes.shape({
        select: PropTypes.object.isRequired,
        prepare: PropTypes.func
      }).isRequired
    }),
    children: PropTypes.func
  };

  state = {
    error: null,
    snapshot: null,
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
      .debounceTime(200)
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
            // .do(log('observed for preview', value))
          : Observable.of(null)
      })
      // .do(log('snapshot', value._id))
      .subscribe(snapshot => {
        if (snapshot) {
          this.setState({snapshot, isLive: true})
        } else {
          this.setState({isLive: false})
        }
      })
  }

  render() {
    return this.props.children(this.state)
  }
}
