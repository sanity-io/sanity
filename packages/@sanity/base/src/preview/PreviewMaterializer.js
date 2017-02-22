import React, {PropTypes} from 'react'
import ReactDOM from 'react-dom'
import observeForPreview from './observeForPreview'
import shallowEquals from 'shallow-equals'
import scrollPosition from './scrollPosition'

export default class PreviewMaterializer extends React.PureComponent {
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

    const isVisible$ = scrollPosition.map(windowDimension => {
      const element = ReactDOM.findDOMNode(this)
      const rect = element.getBoundingClientRect()
      return (
        rect.top + rect.height >= 60
        && rect.left + rect.width >= 60
        && rect.bottom - 60 <= windowDimension.height
        && rect.right - 60 <= windowDimension.width
      )
    })
      .share()

    const appear$ = isVisible$
      .scan((wasVisible, isVisible) => !wasVisible && isVisible, false)
      .distinctUntilChanged()
      .filter(Boolean)

    this.subscription = appear$
      .mergeMap(() => {
        return observeForPreview(value, type)
          .takeUntil(isVisible$.filter(isVisible => !isVisible))
          .do({
            next: () => this.setLive(true),
            complete: () => this.setLive(false)
          })
      })
      .subscribe(snapshot => {
        this.setState({snapshot})
      })
  }
  setLive = isLive => {
    this.setState({isLive})
  }
  render() {
    return this.props.children(this.state)
  }
}
