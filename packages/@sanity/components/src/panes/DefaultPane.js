import PropTypes from 'prop-types'
import React from 'react'
import shallowEquals from 'shallow-equals'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import Button from 'part:@sanity/components/buttons/default'
import ScrollContainer from 'part:@sanity/components/utilities/scroll-container'
import Styleable from '../utilities/Styleable'
import defaultStyles from './styles/DefaultPane.css'

const getScrollShadowState = (scrollTop, prevState) => {
  const {headerStyleRatio} = prevState
  const threshold = 100

  if (scrollTop < threshold) {
    // Round of the calculation to cut down rerenders that are not visible to the human eye
    // Example: 0.53 -> 0.55 or 0.91 -> 0.9
    const ratio = Math.round((scrollTop / threshold) * 10 * 2) / 2 / 10
    if (ratio === headerStyleRatio) {
      return null
    }

    return {
      headerStyleRatio: ratio,
      headerStyle: {
        opacity: ratio + 0.5,
        boxShadow: `0 2px ${3 * ratio}px rgba(0, 0, 0, ${ratio * 0.3})`
      }
    }
  }

  if (scrollTop < 0 && headerStyleRatio !== -1) {
    return {
      headerStyleRatio: -1,
      headerStyle: {
        boxShadow: 'none'
      }
    }
  }

  if (headerStyleRatio !== 1) {
    return {
      headerStyleRatio: 1,
      headerStyle: {
        opacity: 1,
        boxShadow: '0 2px 3px rgba(0, 0, 0, 0.3)'
      }
    }
  }

  return null
}

const noop = () => {
  /* intentional noop */
}

// eslint-disable-next-line
class Pane extends React.Component {
  static propTypes = {
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    isCollapsed: PropTypes.bool,
    onExpand: PropTypes.func,
    onCollapse: PropTypes.func,
    shouldRenderMenuButton: PropTypes.func,
    renderMenu: PropTypes.func,
    renderFunctions: PropTypes.func,
    children: PropTypes.node,
    isSelected: PropTypes.bool,
    onMenuToggle: PropTypes.func,
    scrollTop: PropTypes.number,
    styles: PropTypes.object // eslint-disable-line react/forbid-prop-types
  }

  static defaultProps = {
    title: 'Untitled',
    isCollapsed: false,
    isSelected: false,
    scrollTop: undefined,
    styles: {},
    children: <div />,
    onCollapse: noop,
    onExpand: noop,
    onMenuToggle: noop,
    shouldRenderMenuButton: props => Boolean(props.renderMenu),
    renderMenu: undefined,
    renderFunctions: undefined
  }

  state = {
    headerStyleRatio: -1,
    headerStyle: {
      opacity: 0,
      boxShadow: 'none'
    }
  }

  constructor(props) {
    super(props)

    // Passed to `props.renderMenu` so it may pass it onto the rendered <Menu>. This prevents the
    // "click outside" functionality from kicking in when pressing the toggle menu button
    this.paneMenuId = Math.random()
      .toString(36)
      .substr(2, 6)
  }

  static getDerivedStateFromProps(props, state) {
    if (typeof props.scrollTop === 'undefined') {
      return null
    }

    return getScrollShadowState(props.scrollTop, state)
  }

  shouldComponentUpdate(nextProps, nextState) {
    // The pane header has a styling which gradually adds more shadow and tunes the opacity when
    // scrolling. In the case of "managed" lists (infinite scroll and such), the scroll position
    // is passed as a prop (`scrollTop`). However, passed a certain threshold we no longer need to
    // update, since the styling turns static. To prevent the prop from forcing a re-render,
    // explicitly check for a difference in the state here to short-circuit in this common scenario
    const scrollPropChanged = nextProps.scrollTop !== this.props.scrollTop
    const headerStyleChanged = nextState.headerStyleRatio !== this.state.headerStyleRatio
    if (scrollPropChanged && !headerStyleChanged) {
      return false
    }

    return scrollPropChanged || headerStyleChanged || !shallowEquals(nextProps, this.props)
  }

  handleToggleMenu = event => {
    if (this.props.isCollapsed) {
      this.props.onExpand(event)
    } else {
      this.props.onMenuToggle(event)
    }
  }

  handleToggleCollapsed = event => {
    if (this.props.isCollapsed) {
      this.props.onExpand(this)
    } else {
      this.props.onCollapse(this)
    }
  }

  handleContentScroll = event => {
    const shadowState = getScrollShadowState(event.target.scrollTop, this.state)
    if (shadowState) {
      this.setState(shadowState)
    }
  }

  renderMenu() {
    const {styles, isCollapsed, renderMenu, shouldRenderMenuButton} = this.props
    if (!shouldRenderMenuButton(this.props)) {
      return null
    }

    const menu = renderMenu && renderMenu(isCollapsed, this.paneMenuId)
    return (
      <div className={styles.menuWrapper}>
        <div className={styles.menuButtonContainer}>
          <Button
            // Makes menu component ignore clicks on button (prevents double-toggling)
            data-menu-button-id={this.paneMenuId}
            kind="simple"
            icon={IconMoreVert}
            onClick={this.handleToggleMenu}
            className={styles.menuButton}
          />
        </div>
        <div className={styles.menuContainer}>{menu}</div>
      </div>
    )
  }

  render() {
    const {title, children, isSelected, renderFunctions, isCollapsed, styles} = this.props
    const headerStyle = isCollapsed ? {} : this.state.headerStyle

    return (
      <div
        className={`
          ${isCollapsed ? styles.isCollapsed : styles.root}
          ${isSelected ? styles.isActive : styles.isDisabled}
        `}
        ref={this.setRootElement}
      >
        <div className={styles.header} style={{boxShadow: headerStyle.boxShadow}}>
          <div className={styles.headerContent}>
            <h2 className={styles.title} onClick={this.handleToggleCollapsed}>
              {title}
            </h2>
            {renderFunctions && renderFunctions(isCollapsed)}
          </div>
          {this.renderMenu()}
          <div className={styles.headerBackground} style={{opacity: headerStyle.opacity}} />
        </div>
        <div className={styles.main}>
          <ScrollContainer className={styles.scrollContainer} onScroll={this.handleContentScroll}>
            {children}
          </ScrollContainer>
        </div>
      </div>
    )
  }
}

export default Styleable(Pane, defaultStyles)
