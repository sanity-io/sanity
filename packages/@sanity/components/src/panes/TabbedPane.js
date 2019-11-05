import PropTypes from 'prop-types'
import React from 'react'
import SplitHorizontalIcon from 'part:@sanity/base/split-horizontal-icon'
import CloseIcon from 'part:@sanity/base/close-icon'
import Tab from 'part:@sanity/components/tabs/tab'
import TabList from 'part:@sanity/components/tabs/tab-list'
import Styleable from '../utilities/Styleable'
import defaultStyles from './styles/DefaultPane.css'
import DefaultPane from './DefaultPane'

const noop = () => {
  /* intentional noop */
}

// eslint-disable-next-line
class TabbedPane extends React.Component {
  static propTypes = {
    idPrefix: PropTypes.string.isRequired,
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

  renderHeaderViewMenu = () => {
    const {styles, views = [], onSplitPane, onCloseView, isClosable} = this.props

    return (
      <div className={styles.headerViewMenu}>
        {this.renderTabs()}
        <div className={styles.headerPaneActions}>
          {views.length > 1 && (
            <button type="button" onClick={onSplitPane} title="Split pane right">
              <div tabIndex={-1}>
                <SplitHorizontalIcon />
              </div>
            </button>
          )}
          {isClosable && (
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
    const {idPrefix, views = [], activeView, styles, onSetActiveView} = this.props

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

export default Styleable(TabbedPane, defaultStyles)
