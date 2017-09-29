import PropTypes from 'prop-types'
import React from 'react'
import defaultStyles from './styles/DefaultPane.css'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import Button from 'part:@sanity/components/buttons/default'
import Styleable from '../utilities/Styleable'

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
    isScrollable: PropTypes.bool,
    onMenuToggle: PropTypes.func,
    className: PropTypes.string,
    styles: PropTypes.object
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
    renderMenu() {
      return false
    },
    renderFunctions() {},
    isActive: false,
    updateId: 0,
    onMenuToggle() {
      return true
    }
  }

  componentDidMount() {
    this._contentElement.addEventListener('scroll', this.handleContentScroll, {passive: true})
  }

  componentWillUnmount() {
    this._contentElement.removeEventListener('scroll', this.handleContentScroll, {passive: true})
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

  handleContentScroll = event => {
    const threshold = 100
    const scrollTop = event.target.scrollTop
    if (scrollTop < threshold) {
      const ratio = scrollTop / threshold
      this.setState({
        headerStyle: {
          opacity: ratio,
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

  setContentElement = element => {
    this._contentElement = element
  }

  render() {
    const {title, children, isSelected, renderFunctions, renderMenu, isCollapsed, isScrollable, styles} = this.props

    return (
      <div
        className={`
          ${isCollapsed ? styles.isCollapsed : styles.root}
          ${isScrollable ? styles.isScrollable : ''}
          ${isSelected ? styles.isActive : ''}
        `}
        ref={this.setRootElement}
      >
        <div
          className={styles.header}
          style={{
            boxShadow: isCollapsed ? {} : this.state.headerStyle.boxShadow
          }}
        >
          <div className={styles.headerContent}>
            <h2 className={styles.title} onClick={this.handleToggle}>
              {title}
            </h2>
            {
              renderFunctions(isCollapsed)
            }
          </div>
          <div className={styles.menuWrapper}>
            <div className={styles.menuButtonContainer}>
              {
                renderMenu(isCollapsed) && (
                  <Button
                    kind="simple"
                    icon={IconMoreVert}
                    onClick={this.handleMenuToggle}
                    className={styles.menuButton}
                  />
                )
              }
            </div>
            <div className={styles.menuContainer}>
              {renderMenu(isCollapsed)}
            </div>
          </div>
          <div
            className={styles.headerBackground}
            style={{
              opacity: isCollapsed ? {} : this.state.headerStyle.opacity
            }}
          />
        </div>
        <div className={styles.main}>
          <div className={styles.content} ref={this.setContentElement}>
            {children}
          </div>
        </div>
      </div>
    )
  }
}

export default Styleable(Pane, defaultStyles)
