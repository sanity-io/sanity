import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/items/grid-style'

export default class GridItem extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    item: PropTypes.object,
    children: PropTypes.node.isRequired,
    onSelect: PropTypes.func.isRequired,
    layout: PropTypes.string,
    selected: PropTypes.bool,
    highlighted: PropTypes.bool,
    scrollIntoView: PropTypes.func,
  }

  static defaultProps = {
    onSelect() {},
  }

  handleClick = () => {
    this.props.onSelect(this.props.item)
  }

  render() {
    const {children, className, selected, highlighted} = this.props

    const rootStyles = `
      ${styles.root}
      ${selected ? styles.selected : ''}
      ${highlighted ? styles.highlighted : ''}
      ${className}
    `
    return (
      <li className={rootStyles}>
        <a onClick={this.handleClick} className={styles.link}>
          {children}
        </a>
      </li>
    )
  }
}
