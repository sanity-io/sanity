import PropTypes from 'prop-types'
import React from 'react'
import StyleSelect from 'part:@sanity/components/selects/style'
import styles from './styles/BlockStyle.css'

export const blockStyleShape = PropTypes.shape({
  key: PropTypes.string,
  active: PropTypes.bool,
  title: PropTypes.string,
  preview: PropTypes.node,
})

export default class BlockStyle extends React.Component {

  static propTypes = {
    value: PropTypes.arrayOf(blockStyleShape),
    items: PropTypes.arrayOf(blockStyleShape),
    onSelect: PropTypes.func
  }

  renderItem = item => {
    return item.preview
  }

  render() {
    if (!this.props.items || this.props.items.length === 0) {
      return null
    }
    return (
      <StyleSelect
        className={styles.root}
        label="Text"
        items={this.props.items}
        value={this.props.value}
        onChange={this.props.onSelect}
        renderItem={this.renderItem}
        transparent
      />
    )
  }
}
