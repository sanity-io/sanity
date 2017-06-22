import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/DefaultPane.css'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'
import ElementQuery from 'react-element-query'

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
    updateId: PropTypes.number
  }

  static defaultProps = {
    title: 'Untitled',
    isCollapsed: false,
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
    const {title, children, isSelected, renderFunctions, renderMenu, isCollapsed} = this.props
    const {showMenu} = this.state

    return (
      <div
        className={`
          ${(isCollapsed) ? styles.isCollapsed : styles.root}
          ${isSelected ? styles.isActive : ''}
        `}
        ref={this.setRootElement}
      >
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title} onClick={this.handleToggle}>
              {title}
            </h2>
            <ElementQuery
              sizes={[
                {name: styles.functionsSmall, width: 150},
                {name: styles.functionsLarge, width: 400}
              ]}
            >
              {
                renderFunctions()
              }
            </ElementQuery>
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
