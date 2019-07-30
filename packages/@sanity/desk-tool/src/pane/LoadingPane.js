import React from 'react'
import PropTypes from 'prop-types'
import DefaultPane from 'part:@sanity/components/panes/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import styles from './styles/LoadingPane.css'

export default class LoadingPane extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
    isSelected: PropTypes.bool.isRequired,
    isCollapsed: PropTypes.bool.isRequired,
    onExpand: PropTypes.func,
    onCollapse: PropTypes.func,
    path: PropTypes.arrayOf(PropTypes.string),
    index: PropTypes.number,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
  }

  static defaultProps = {
    message: 'Loading…',
    path: [],
    title: '\u00a0',
    index: undefined,
    onExpand: undefined,
    onCollapse: undefined
  }

  constructor(props) {
    super(props)

    const isGetter = typeof props.message === 'function'
    const currentMessage = isGetter ? props.message(props.path) : props.message
    const isObservable = typeof currentMessage.subscribe === 'function'
    const state = {currentMessage: isObservable ? LoadingPane.defaultProps.message : currentMessage}

    if (isObservable) {
      let isSync = true
      this.subscription = currentMessage.subscribe(message => {
        if (isSync) {
          state.currentMessage = message
        } else {
          this.setState({currentMessage: message})
        }
      })
      isSync = false
    }

    this.state = state
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  render() {
    const {isSelected, isCollapsed, onCollapse, onExpand, title} = this.props
    const {currentMessage} = this.state

    return (
      <DefaultPane
        title={title}
        isScrollable={false}
        isSelected={isSelected}
        isCollapsed={isCollapsed}
        onCollapse={onCollapse}
        onExpand={onExpand}
        index={this.props.index}
      >
        {/* div wrapper to match styling of documents list pane - prevents spinner
         * from jumping to new position when pane definition is loaded */}
        <div className={styles.root}>
          <Spinner center message={currentMessage} />
        </div>
      </DefaultPane>
    )
  }
}
