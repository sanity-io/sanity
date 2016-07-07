import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/menus/default'
// import enhanceWithClickOutside from 'react-click-outside'

class DefaultMenu extends React.Component {
  static propTypes = {
    opened: PropTypes.bool,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        onClick: PropTypes.func,
        icon: PropTypes.string
      })
    )
  }

  static defaultProps = {
    menuOpened: false
  }

  // constructor(props, context) {
  //   super(props, context)
  //   // this.handleOnClick = this.handleOnClick.bind(this)
  // }

  handleClickOutside() {
    this.setState({menuOpened: false})
  }

  render() {
    const {items} = this.props

    return (
      <div className={this.props.opened ? styles.opened : styles.closed}>
        <ul className={styles.list}>
          {
            items.map((item, i) => {
              return (
                <li key={i} className={styles.item}>
                  <a onClick={item.onClick} className={styles.link}>
                    {item.title}
                  </a>
                </li>
              )
            })
          }
        </ul>
      </div>
    )
  }
}

export default DefaultMenu
