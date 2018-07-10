import PropTypes from 'prop-types'
import React from 'react'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import Button from 'part:@sanity/components/buttons/default'
import ScrollContainer from 'part:@sanity/components/utilities/scroll-container'
import Styleable from '../utilities/Styleable'
import defaultStyles from './styles/DefaultPane.css'

const noop = () => {
  /* intentional noop */
}

// eslint-disable-next-line
class Pane extends React.PureComponent {
  static propTypes = {
    className: PropTypes.string,
    width: PropTypes.number,
    minWidth: PropTypes.number,
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
    className: '',
    minWidth: 0,
    width: 0,
    styles: {},
    children: <div />,
    onCollapse: noop,
    onExpand: noop,
    onMenuToggle: noop,
    scrollTop: undefined,
    shouldRenderMenuButton: props => Boolean(props.renderMenu),
    renderMenu: undefined,
    renderFunctions: undefined
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.scrollTop !== this.props.scrollTop) {
      this.setScrollShadow(nextProps.scrollTop)
    }
  }

  state = {
    headerStyle: {
      opacity: 0,
      boxShadow: 'none'
    }
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

  setScrollShadow = scrollTop => {
    const threshold = 100
    if (scrollTop < threshold) {
      const ratio = scrollTop / threshold
      this.setState({
        headerStyle: {
          opacity: ratio + 0.5,
          boxShadow: `0 2px ${3 * ratio}px rgba(0, 0, 0, ${ratio * 0.3})`
        }
      })
    } else {
      this.setState({
        headerStyle: {
          opacity: 1,
          boxShadow: '0 2px 3px rgba(0, 0, 0, 0.3)'
        }
      })
    }

    if (scrollTop < 0) {
      this.setState({
        headerStyle: {
          boxShadow: 'none'
        }
      })
    }
  }

  handleContentScroll = event => {
    this.setScrollShadow(event.target.scrollTop)
  }

  renderMenu() {
    const {styles, isCollapsed, renderMenu, shouldRenderMenuButton} = this.props
    if (!shouldRenderMenuButton(this.props)) {
      return null
    }

    const menu = renderMenu && renderMenu(isCollapsed)
    return (
      <div className={styles.menuWrapper}>
        <div className={styles.menuButtonContainer}>
          <Button
            // Makes menu component ignore clicks on button (prevents double-toggling)
            data-is-menu-button="true"
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

    return (
      <div
        className={`
          ${isCollapsed ? styles.isCollapsed : styles.root}
          ${isSelected ? styles.isActive : styles.isDisabled}
        `}
        ref={this.setRootElement}
      >
        <div
          className={styles.header}
          style={{boxShadow: isCollapsed ? '' : this.state.headerStyle.boxShadow}}
        >
          <div className={styles.headerContent}>
            <h2 className={styles.title} onClick={this.handleToggleCollapsed}>
              {title}
            </h2>
            {renderFunctions && renderFunctions(isCollapsed)}
          </div>
          {this.renderMenu()}
          <div
            className={styles.headerBackground}
            style={{
              opacity: isCollapsed ? '' : this.state.headerStyle.opacity
            }}
          />
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
