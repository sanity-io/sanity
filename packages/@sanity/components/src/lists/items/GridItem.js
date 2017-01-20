import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/items/grid-style'
import {StateLink} from 'part:@sanity/base/router'

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
    const {children, className, selected, highlighted, item} = this.props

    const rootStyles = `
      ${styles.root}
      ${selected ? styles.selected : ''}
      ${highlighted ? styles.highlighted : ''}
      ${className}
    `
    return (
      <li className={rootStyles}>
        {
          item.stateLink && (
            <StateLink className={styles.link} onClick={this.handleClick} state={item.stateLink}>
              {children}
            </StateLink>
          )
        }
        {
          !item.stateLink && (
            <div className={styles.noLink} onClick={this.handleClick}>
              {children}
            </div>
          )
        }
      </li>
    )
  }
}
