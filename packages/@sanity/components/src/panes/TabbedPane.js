import PropTypes from 'prop-types'
import React from 'react'
import BarsIcon from 'part:@sanity/base/bars-icon'
import CloseIcon from 'part:@sanity/base/close-icon'
import Styleable from '../utilities/Styleable'
import defaultStyles from './styles/DefaultPane.css'
import DefaultPane from './DefaultPane'

const noop = () => {
  /* intentional noop */
}

// eslint-disable-next-line
class TabbedPane extends React.Component {
  static propTypes = {
    styles: PropTypes.shape({
      headerTabsContainer: PropTypes.string,
      headerPaneActions: PropTypes.string,
      headerViewMenu: PropTypes.string
    }),
    views: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired
      })
    ),
    activeView: PropTypes.string,
    isClosable: PropTypes.bool,
    onSetActiveView: PropTypes.func,
    onSplitPane: PropTypes.func,
    onCloseView: PropTypes.func
  }

  static defaultProps = {
    styles: {},
    views: [],
    activeView: undefined,
    isClosable: false,
    onSetActiveView: noop,
    onSplitPane: noop,
    onCloseView: noop
  }

  state = {}

  renderHeaderView = () => {
    const {styles, onSplitPane, onCloseView, isClosable} = this.props

    return (
      <div className={styles.headerViewMenu}>
        {this.renderTabs()}
        <div className={styles.headerPaneActions}>
          <button type="button" onClick={onSplitPane} title="Split pane">
            <div tabIndex={-1}>
              <BarsIcon />
            </div>
          </button>
          {isClosable && (
            <button type="button" onClick={onCloseView} title="Toggle view">
              <div tabIndex={-1}>
                <CloseIcon />
              </div>
            </button>
          )}
        </div>
      </div>
    )
  }

  renderTabs() {
    const {views = [], activeView, styles, onSetActiveView} = this.props
    if (views.length <= 1) {
      return null
    }

    return (
      <div className={styles.headerTabsContainer}>
        {views.map((view, index) => (
          // eslint-disable-next-line react/jsx-no-bind
          <button
            key={view.id}
            type="button"
            className={activeView === view.id ? styles.activeTab : styles.tab}
            onClick={() => onSetActiveView(index === 0 ? null : view.id)}
          >
            {view.title}
          </button>
        ))}
      </div>
    )
  }

  render() {
    const {views, onSetActiveView, onSplitPane, onCloseView, ...rest} = this.props

    return <DefaultPane renderHeaderView={this.renderHeaderView} {...rest} />
  }
}

export default Styleable(TabbedPane, defaultStyles)
