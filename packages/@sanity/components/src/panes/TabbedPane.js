import PropTypes from 'prop-types'
import React from 'react'
import SplitHorizontalIcon from 'part:@sanity/base/split-horizontal-icon'
import CloseIcon from 'part:@sanity/base/close-icon'
import Tab from 'part:@sanity/components/tabs/tab'
import TabList from 'part:@sanity/components/tabs/tab-list'
import DefaultPane from './DefaultPane'

import styles from './TabbedPane.css'

const noop = () => {
  /* intentional noop */
}

// eslint-disable-next-line
class TabbedPane extends React.Component {
  static propTypes = {
    idPrefix: PropTypes.string.isRequired,
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
    views: [],
    activeView: undefined,
    isClosable: false,
    onSetActiveView: noop,
    onSplitPane: undefined,
    onCloseView: noop
  }

  state = {}

  renderHeaderViewMenu = () => {
    const {views = [], onSplitPane, onCloseView, isClosable} = this.props
    const isSplittable = Boolean(onSplitPane)

    // Do not render view menu when there are only 1 view
    if (views.length <= 1) return null

    return (
      <div className={styles.tabsContainer}>
        {this.renderTabs()}
        <div className={styles.headerPaneActions}>
          {isSplittable && views.length > 1 && (
            <button type="button" onClick={onSplitPane} title="Split pane right">
              <div tabIndex={-1}>
                <SplitHorizontalIcon />
              </div>
            </button>
          )}
          {isSplittable && isClosable && (
            <button type="button" onClick={onCloseView} title="Close pane">
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
    const {idPrefix, views = [], activeView, onSetActiveView} = this.props

    if (views.length <= 1) {
      return null
    }

    const tabPanelId = `${idPrefix}tabpanel`

    return (
      <div className={styles.headerTabsContainer}>
        <TabList>
          {views.map((view, index) => (
            <Tab
              id={`${idPrefix}tab-${view.id}`}
              isActive={activeView === view.id}
              key={view.id}
              label={<>{view.title}</>}
              icon={view.icon}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => onSetActiveView(index === 0 ? null : view.id)}
              aria-controls={tabPanelId}
            />
          ))}
        </TabList>
      </div>
    )
  }

  render() {
    const {
      activeView,
      idPrefix,
      views = [],
      onSetActiveView,
      onSplitPane,
      onCloseView,
      ...rest
    } = this.props
    const hasTabs = views.length > 1

    return (
      <DefaultPane
        hasTabs={hasTabs}
        renderHeaderViewMenu={this.renderHeaderViewMenu}
        tabIdPrefix={idPrefix}
        viewId={activeView}
        {...rest}
      />
    )
  }
}

export default TabbedPane
