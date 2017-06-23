import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/DefaultPane.css'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'

export default class Pane extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    isCollapsed: PropTypes.bool,
    onExpand: PropTypes.func,
    onCollapse: PropTypes.func,
    minWidth: PropTypes.number,
    width: PropTypes.number,
    renderMenu: PropTypes.func,
    renderFunctions: PropTypes.func,
    children: PropTypes.node,
    isSelected: PropTypes.bool,
    updateId: PropTypes.number,
    isScrollable: PropTypes.bool
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
    renderMenu: false,
    renderFunctions() {},
    isActive: false,
    updateId: 0
  }

  state = {
    showMenu: false
  }

  handleToggle = event => {
    console.log('handleClick')
    if (!this.state.isCollapsed) {
      this.props.onExpand(event)
    }
  }

  setRootElement = element => {
    this._rootElement = element
  }

  handleToggleMenu = () => {
    this.setState({
      showMenu: !this.state.showMenu
    })
  }

  render() {
    const {title, children, isSelected, renderFunctions, renderMenu, isCollapsed, isScrollable} = this.props
    const {showMenu} = this.state

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
              renderFunctions()
            }
          </div>
          {
            renderMenu && <div className={styles.menuWrapper}>
              <div className={styles.menuButtonContainer}>
                <div className={styles.menuButton} onClick={this.handleToggleMenu}>
                  <IconMoreVert />
                </div>
              </div>
              {
                showMenu && (
                  <div className={styles.menuContainer}>
                    {renderMenu(isCollapsed)}
                  </div>
                )
              }
            </div>
          }
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
