import React, {PropTypes} from 'react'
import styles from '../../styles/Pane.css'
import Spinner from 'component:@sanity/components/loading/spinner'
import PaneMenu from './PaneMenu.js'
import IconHamburger from 'icon:@sanity/hamburger'

export default class Pane extends React.Component {

  static propTypes = {
    isActive: PropTypes.bool,
    loading: PropTypes.bool,
    items: PropTypes.array,
    renderItem: PropTypes.func
  }

  constructor(...args) {
    super(...args)
    this.state = {
      menuOpened: false
    }
  }

  handleMenuButtonClick() {
    this.handleMenuOpen()
  }

  render() {
    const {loading, items, renderItem, isActive} = this.props
    const {menuOpened} = this.state

    return (
      <div className={isActive ? styles.isActive : styles.pane}>
        <div className={styles.menuButton} onClick={this.handleMenuButtonClick}>
          <IconHamburger />
        </div>
        <PaneMenu opened={menuOpened} />
        <ul className={styles.paneItems}>
          {loading && <Spinner />}
          {items.map((item, i) => {
            return (
              <li className={styles.paneItem} key={item.key}>
                {renderItem(item, i)}
              </li>
            )
          })
          }
        </ul>
      </div>
    )
  }
}
