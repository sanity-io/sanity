import PropTypes from 'prop-types'
import React from 'react'
import defaultStyles from './styles/DefaultPane.css'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import Button from 'part:@sanity/components/buttons/default'
import Styleable from '../utilities/Styleable'
import ScrollContainer from 'part:@sanity/components/utilities/scroll-container'

class Pane extends React.PureComponent {
  static propTypes = {
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    isCollapsed: PropTypes.bool,
    onExpand: PropTypes.func,
    onCollapse: PropTypes.func,
    minWidth: PropTypes.number,
    width: PropTypes.number,
    renderMenu: PropTypes.func,
    renderFunctions: PropTypes.func,
    children: PropTypes.node,
    isSelected: PropTypes.bool,
    onMenuToggle: PropTypes.func,
    className: PropTypes.string,
    styles: PropTypes.object,
    scrollTop: PropTypes.number
  }

  static defaultProps = {
    title: 'Untitled',
    isCollapsed: false,
    className: '',
    isScrollable: true,
    minWidth: 0,
    width: 0,
    styles: {},
    children: <div />,
    onCollapse() {},
    onExpand() {},
    renderMenu: undefined,
    renderFunctions: undefined,
    isActive: false,
    updateId: 0,
    scrollTop: undefined,
    onMenuToggle() {
      return true
    }
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

  handleMenuToggle = event => {
    if (this.props.isCollapsed) {
      this.props.onExpand(event)
    } else {
      this.props.onMenuToggle(event)
    }
  }

  handleToggle = event => {
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
    const {styles, isCollapsed, renderMenu} = this.props
    const menu = renderMenu && renderMenu(isCollapsed)
    if (!menu) {
      return null
    }

    return (
      <div className={styles.menuWrapper}>
        <div className={styles.menuButtonContainer}>
          {renderMenu(isCollapsed) && (
            <Button
              kind="simple"
              icon={IconMoreVert}
              onClick={this.handleMenuToggle}
              className={styles.menuButton}
            />
          )}
        </div>
        <div className={styles.menuContainer}>{menu}</div>
      </div>
    )
  }

  render() {
    const {
      title,
      children,
      isSelected,
      renderFunctions,
      renderMenu,
      isCollapsed,
      styles
    } = this.props

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
          style={{
            boxShadow: isCollapsed ? '' : this.state.headerStyle.boxShadow
          }}
        >
          <div className={styles.headerContent}>
            <h2 className={styles.title} onClick={this.handleToggle}>
              {title}
            </h2>
            {renderFunctions && renderFunctions(isCollapsed)}
          </div>
          {this.renderMenu(isCollapsed)}
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
