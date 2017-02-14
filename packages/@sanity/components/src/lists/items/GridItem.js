import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/items/grid-style'

export default class GridItem extends React.PureComponent {
  static propTypes = {
    className: PropTypes.string,
    item: PropTypes.object,
    children: PropTypes.node.isRequired,
    onSelect: PropTypes.func,
    onOpen: PropTypes.func,
    layout: PropTypes.string,
    selected: PropTypes.bool,
    highlighted: PropTypes.bool,
    scrollIntoView: PropTypes.func,
  }

  static defaultProps = {
    onSelect() {},
    onOpen() {}
  }

  handleClick = () => {
    this.props.onSelect(this.props.item)
  }

  handleDoubleClick = event => {
    this.props.onOpen(this.props.item)
  }

  render() {
    const {children} = this.props
    return (
      <div className={styles.noLink} onClick={this.handleClick} onDoubleClick={this.handleDoubleClick}>
        {children}
      </div>
    )
  }
}
