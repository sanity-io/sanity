import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import observeForPreview from './observeForPreview'
import shallowEquals from 'shallow-equals'
import resize$ from './streams/resize'
import scroll$ from './streams/scroll'
import orientationChange$ from './streams/orientationChange'
import visibility$ from './streams/visibilityChange'

function contains(element, viewport) {
  const rect = element.getBoundingClientRect()
  return (
    rect.top + rect.height >= 60
    && rect.left + rect.width >= 60
    && rect.bottom - 60 <= viewport.height
    && rect.right - 60 <= viewport.width
  )
}

const viewport$ = resize$
  .merge(orientationChange$)
  .merge(scroll$)
  .withLatestFrom(resize$)
  .map(([, viewport]) => viewport)
  .debounceTime(100)

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

    const elementVisibility$ = viewport$
      .map(viewport => contains(ReactDOM.findDOMNode(this), viewport))
      .share()

    const tabVisibility$ = visibility$.share()

    const activateTab$ = tabVisibility$.filter(Boolean)
    const deactivateTab$ = tabVisibility$.filter(visible => !visible)

    const activateElement$ = elementVisibility$.filter(Boolean)
    const deActivateElement$ = elementVisibility$.filter(visible => !visible)

    this.subscription = activateTab$
      .switchMap(() =>
        activateElement$
          .switchMap(() =>
            observeForPreview(value, type)
              .takeUntil(deActivateElement$.do(() => this.setLive(false)))
          )
          .takeUntil(deactivateTab$.do(() => this.setLive(false)))
      )
      .subscribe(snapshot => {
        this.setState({isLive: true, snapshot})
      })
  }

  setLive = isLive => {
    this.setState({isLive})
  }

  render() {
    return this.props.children(this.state)
  }
}
