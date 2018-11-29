import React from 'react'
import PropTypes from 'prop-types'
import {merge, of} from 'rxjs'
import {mapTo, delay} from 'rxjs/operators'
import DefaultPane from 'part:@sanity/components/panes/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import styles from './styles/LoadingPane.css'

function getWaitMessages(path) {
  const thresholds = [{ms: 300, message: 'Loading…'}, {ms: 5000, message: 'Still loading…'}]

  if (__DEV__) {
    const message = [
      'Check console for errors?',
      'Is your observable/promise resolving?',
      path.length > 0 ? `Structure path: ${path.join(' ➝ ')}` : ''
    ]

    thresholds.push({
      ms: 10000,
      message: message.join('\n')
    })
  }

  const src = of(null)
  return merge(
    ...thresholds.map(({ms, message}) =>
      src.pipe(
        mapTo(message),
        delay(ms)
      )
    )
  )
}

export default class LoadingPane extends React.PureComponent {
  static propTypes = {
    isSelected: PropTypes.bool.isRequired,
    isCollapsed: PropTypes.bool.isRequired,
    onExpand: PropTypes.func,
    onCollapse: PropTypes.func,
    path: PropTypes.arrayOf(PropTypes.string),
    index: PropTypes.number
  }

  static defaultProps = {
    path: [],
    onExpand: undefined,
    onCollapse: undefined
  }

  state = {message: 'Loading…'}

  componentDidMount() {
    this.subscription = getWaitMessages(this.props.path).subscribe(this.updateStatus)
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  updateStatus = message => {
    this.setState({message})
  }

  render() {
    const {isSelected, isCollapsed, onCollapse, onExpand} = this.props
    const {message} = this.state

    return (
      <DefaultPane
        title={'\u00a0'} // Non-breaking space
        isSelected={isSelected}
        isCollapsed={isCollapsed}
        onCollapse={onCollapse}
        onExpand={onExpand}
        index={this.props.index}
      >
        {/* div wrapper to match styling of documents list pane - prevents spinner
          * from jumping to new position when pane definition is loaded */}
        <div className={styles.root}>
          <Spinner center message={message} />
        </div>
      </DefaultPane>
    )
  }
}
