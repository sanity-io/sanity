import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/DefaultPane.css'
import Button from 'part:@sanity/components/buttons/default'
import IconMoreVert from 'part:@sanity/base/more-vert-icon'

export default class Pane extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    isCollapsed: PropTypes.string,
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

  handleClick = event => {
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
    const {title, minWidth, children, isSelected, renderFunctions, renderMenu, isCollapsed, width} = this.props
    const {showMenu} = this.state

    return (
      <div
        className={`
          ${(isCollapsed) ? styles.collapsed : styles.root}
          ${isSelected ? styles.isActive : ''}
        `}
        onClick={this.handleClick}
        ref={this.setRootElement}
      >
        <div className={styles.header}>
          {
            renderMenu && <div className={styles.menuContainer}>
              <div className={styles.menuButtonContainer}>
                <Button kind="simple" icon={IconMoreVert} onClick={this.handleToggleMenu} />
                {
                  showMenu && renderMenu()
                }
              </div>
            </div>
          }
          <div className={styles.headerContent}>
            <h2 className={styles.title}>
              {title}
            </h2>
            <div className={styles.functions}>
              {
                renderFunctions()
              }
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
