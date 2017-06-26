import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/DefaultPane.css'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'

export default class Pane extends React.PureComponent {
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
    onMenuToggle: PropTypes.func
  }

  static defaultProps = {
    title: 'Untitled',
    isCollapsed: false,
    isScrollable: true,
    minWidth: 0,
    width: 0,
    Functions: <div />,
    menu: <div />,
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

  render() {
    const {title, children, isSelected, renderFunctions, renderMenu, isCollapsed, isScrollable} = this.props

    return (
      <div
        className={`
          ${isCollapsed ? styles.isCollapsed : styles.root}
          ${isScrollable ? styles.isScrollable : ''}
          ${isSelected ? styles.isActive : ''}
        `}
        ref={this.setRootElement}
      >
        <div className={styles.header}>
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
              <div className={styles.menuButton} onClick={this.handleMenuToggle}>
                {
                  renderMenu(isCollapsed) && (
                    <IconMoreVert />
                  )
                }
              </div>
            </div>
            <div className={styles.menuContainer}>
              {renderMenu(isCollapsed)}
            </div>
          </div>
        </div>
        <div className={styles.main}>
          <div className={styles.content}>
            <div>
              {children}
            </div>
          </div>
        </div>
      </div>
    )
  }
}
